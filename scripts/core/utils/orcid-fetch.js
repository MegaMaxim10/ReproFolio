/**
 * ORCID Data Fetching Module
 * Fetches researcher profile data from ORCID public API v3.0
 * Handles multiple sections: works, education, employment, peer-review, grants, professional activities
 */

import https from "https";

/**
 * Fetch data from ORCID API with error handling
 */
function fetchFromOrcid(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "pub.orcid.org",
      port: 443,
      path: path,
      method: "GET",
      headers: {
        "Accept": "application/json",
        "User-Agent": "ReproFolio/1.0"
      }
    };

    https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`Failed to parse ORCID response: ${e.message}`));
          }
        } else if (res.statusCode === 404) {
          resolve(null);
        } else {
          reject(new Error(`ORCID API returned status ${res.statusCode}`));
        }
      });
    }).on("error", reject).end();
  });
}

/**
 * Fetch works (publications) from ORCID profile
 */
async function fetchWorks(orcidId) {
  try {
    const data = await fetchFromOrcid(`/v3.0/${orcidId}/works`);
    if (!data || !data.group) {
      return [];
    }

    // Each group contains multiple works with the same ID
    const works = [];
    for (const group of data.group) {
      if (group["work-summary"] && group["work-summary"].length > 0) {
        const summary = group["work-summary"][0];
        // Title is nested: summary.title.title.value
        const title = summary.title?.title?.value || "Untitled";
        const journalTitle = summary["journal-title"]?.value;
        
        works.push({
          putCode: summary["put-code"],
          title: title,
          type: summary.type || "other",
          publicationDate: summary["publication-date"],
          journalTitle: journalTitle,
          externalIds: summary["external-ids"],
          url: summary.url?.value,
          orcidId: orcidId
        });
      }
    }

    return works;
  } catch (error) {
    console.warn(`Failed to fetch works for ${orcidId}: ${error.message}`);
    return [];
  }
}

/**
 * Fetch full details of a specific work
 */
async function fetchWorkDetails(orcidId, putCode) {
  try {
    if (!putCode) {
      console.warn(`No putCode provided for work details fetch`);
      return null;
    }
    
    const data = await fetchFromOrcid(`/v3.0/${orcidId}/work/${putCode}`);
    if (!data) {
      return null;
    }

    const citationValue = typeof data.citation === "string"
      ? data.citation
      : data.citation?.["citation-value"] || data.citation?.citationValue;
    const citationType = typeof data.citation === "string"
      ? "plain-text"
      : data.citation?.["citation-type"] || data.citation?.citationType;

    return {
      putCode: data["put-code"],
      title: data.title?.title?.value || "Untitled",
      subtitle: data.title?.subtitle?.value,
      type: data.type || "other",
      publicationDate: data["publication-date"],
      journalTitle: data["journal-title"]?.value,
      volume: data["journal-volume"]?.value || data.volume?.value || data.volume,
      issue: data["journal-issue"]?.value || data.issue?.value || data.issue,
      number: data.number?.value || data.number,
      pages: data["page-range"] || data.pages?.value || data.pages,
      description: data["short-description"] || data.description,
      citationType,
      citationText: citationValue,
      contributors: data.contributors?.contributor?.map(c => ({
        name: c["credit-name"]?.value,
        role: c["contributor-attributes"]?.["contributor-role"],
        sequence: c["contributor-attributes"]?.["contributor-sequence"]
      })),
      externalIds: data["external-ids"],
      url: data.url?.value,
      languageCode: data["language-code"],
      country: data.country,
      visibility: data.visibility
    };
  } catch (error) {
    console.warn(`Failed to fetch work details for ${orcidId}/${putCode}: ${error.message}`);
    return null;
  }
}

/**
 * Fetch education records
 */
async function fetchEducation(orcidId) {
  try {
    const data = await fetchFromOrcid(`/v3.0/${orcidId}/educations`);
    if (!data) {
      console.warn(`No education data returned for ${orcidId}`);
      return [];
    }

    // ORCID API v3.0 returns data under 'affiliation-group' array
    const groups = data["affiliation-group"] || [];
    if (groups.length === 0) {
      console.warn(`No education affiliations found for ${orcidId}`);
      return [];
    }

    const educationRecords = [];
    for (const group of groups) {
      const summaries = group.summaries || [];
      for (const summaryWrapper of summaries) {
        const edu = summaryWrapper["education-summary"];
        if (edu) {
          educationRecords.push({
            institution: edu["organization"]?.name || "Unknown",
            degree: edu["role-title"] || "",
            field: edu["department-name"] || "",
            startDate: edu["start-date"],
            endDate: edu["end-date"],
            description: edu.description
          });
        }
      }
    }

    return educationRecords;
  } catch (error) {
    console.warn(`Failed to fetch education for ${orcidId}: ${error.message}`);
    return [];
  }
}

/**
 * Fetch employment records
 */
async function fetchEmployment(orcidId) {
  try {
    const data = await fetchFromOrcid(`/v3.0/${orcidId}/employments`);
    if (!data) {
      console.warn(`No employment data returned for ${orcidId}`);
      return [];
    }

    // ORCID API v3.0 returns data under 'affiliation-group' array
    const groups = data["affiliation-group"] || [];
    if (groups.length === 0) {
      console.warn(`No employment affiliations found for ${orcidId}`);
      return [];
    }

    const employmentRecords = [];
    for (const group of groups) {
      const summaries = group.summaries || [];
      for (const summaryWrapper of summaries) {
        const emp = summaryWrapper["employment-summary"];
        if (emp) {
          employmentRecords.push({
            organization: emp["organization"]?.name || "Unknown",
            position: emp["role-title"] || "",
            department: emp["department-name"],
            startDate: emp["start-date"],
            endDate: emp["end-date"],
            description: emp.description
          });
        }
      }
    }

    return employmentRecords;
  } catch (error) {
    console.warn(`Failed to fetch employment for ${orcidId}: ${error.message}`);
    return [];
  }
}

/**
 * Fetch peer review records
 */
async function fetchPeerReviews(orcidId) {
  try {
    const data = await fetchFromOrcid(`/v3.0/${orcidId}/peer-reviews`);
    if (!data) {
      console.warn(`No peer review data returned for ${orcidId}`);
      return [];
    }

    // ORCID API v3.0 returns data under 'group' array
    const groups = data.group || [];
    if (groups.length === 0) {
      console.warn(`No peer review groups found for ${orcidId}`);
      return [];
    }

    const reviews = [];
    for (const group of groups) {
      // Each group can have nested peer-review-group array
      const prGroups = group["peer-review-group"] || [];
      for (const prGroup of prGroups) {
        const summaries = prGroup["peer-review-summary"] || [];
        for (const summary of summaries) {
          const subjectName = summary["subject-name"]?.title?.value
            || summary["subject-name"]?.value
            || summary["subject-name"]
            || "";
          const reviewJournal = summary["subject-container-name"]?.value
            || summary["subject-container-name"]
            || summary["review-group-id"]
            || "";

          reviews.push({
            type: summary["type"] || "peer-review",
            role: summary["reviewer-role"],
            completionDate: summary["completion-date"],
            reviewType: summary["review-type"],
            reviewUrl: summary["review-url"]?.value,
            subjectName,
            reviewJournal,
            subjectType: summary["subject-type"],
            subjectUrl: summary["subject-url"]?.value,
            organization: summary["convening-organization"]?.name || "Unknown",
            groupId: group["group-id"]
          });
        }
      }
    }

    return reviews;
  } catch (error) {
    console.warn(`Failed to fetch peer reviews for ${orcidId}: ${error.message}`);
    return [];
  }
}

/**
 * Fetch grants
 */
async function fetchGrants(orcidId) {
  try {
    const data = await fetchFromOrcid(`/v3.0/${orcidId}/grants`);
    if (!data) {
      console.warn(`No grants data returned for ${orcidId}`);
      return [];
    }

    // ORCID API v3.0 returns data under 'affiliation-group' array
    const groups = data["affiliation-group"] || [];
    if (groups.length === 0) {
      console.warn(`No grants found for ${orcidId}`);
      return [];
    }

    const grantRecords = [];
    for (const group of groups) {
      const summaries = group.summaries || [];
      for (const summaryWrapper of summaries) {
        const grant = summaryWrapper["funding-summary"];
        if (grant) {
          grantRecords.push({
            title: grant["role-title"] || grant["title"]?.value || "Untitled",
            organization: grant["organization"]?.name || "Unknown",
            amount: grant["amount"]?.value,
            currency: grant["amount"]?.currency,
            startDate: grant["start-date"],
            endDate: grant["end-date"],
            description: grant.description
          });
        }
      }
    }

    return grantRecords;
  } catch (error) {
    console.warn(`Failed to fetch grants for ${orcidId}: ${error.message}`);
    return [];
  }
}

/**
 * Fetch professional activities
 * ORCID API: Fetches service roles or professional activity assignments
 * This endpoint returns structured professional activity records
 */
async function fetchProfessionalActivities(orcidId) {
  try {
    // Try the services endpoint first
    let data = await fetchFromOrcid(`/v3.0/${orcidId}/services`);
    
    if (!data) {
      console.warn(`No professional activities data returned for ${orcidId}`);
      return [];
    }

    // Check for affiliation-group (structured data)
    let groups = data["affiliation-group"] || [];
    
    // If no affiliation groups, return empty
    if (groups.length === 0) {
      console.warn(`No professional activity records found for ${orcidId}`);
      return [];
    }

    const activityRecords = [];
    for (const group of groups) {
      const summaries = group.summaries || [];
      for (const summaryWrapper of summaries) {
        const activity = summaryWrapper["service-summary"];
        if (activity) {
          activityRecords.push({
            role: activity["role-title"] || "Professional Activity",
            organization: activity["organization"]?.name || "Unknown",
            startDate: activity["start-date"],
            endDate: activity["end-date"],
            description: activity.description
          });
        }
      }
    }

    return activityRecords;
  } catch (error) {
    console.warn(`Failed to fetch professional activities for ${orcidId}: ${error.message}`);
    return [];
  }
}

/**
 * Filter works by type(s)
 */
function filterWorksByType(works, workTypes) {
  if (!workTypes || workTypes.length === 0) {
    return works;
  }

  const allowedTypes = workTypes.map(t => t.toLowerCase());
  return works.filter(work =>
    allowedTypes.includes((work.type || "").toLowerCase())
  );
}

/**
 * Sort works by specified order
 */
function sortWorks(works, sortBy = "date-desc") {
  const sorted = [...works];

  switch (sortBy) {
    case "date-asc":
      return sorted.sort((a, b) => {
        const dateA = new Date(a.publicationDate?.["year"]?.value || 0);
        const dateB = new Date(b.publicationDate?.["year"]?.value || 0);
        return dateA - dateB;
      });

    case "title":
      return sorted.sort((a, b) => a.title.localeCompare(b.title));

    case "date-desc":
    default:
      return sorted.sort((a, b) => {
        const dateA = new Date(a.publicationDate?.["year"]?.value || 0);
        const dateB = new Date(b.publicationDate?.["year"]?.value || 0);
        return dateB - dateA;
      });
  }
}

/**
 * Enrich works with full details and apply filters/sorting
 */
async function enrichWorks(works, filters = {}) {
  const { workType, sortBy = "date-desc", limit, fetchDetails = true } = filters;

  // Fetch full details for each work if requested
  let enrichedWorks = works;
  if (fetchDetails && works.length > 0) {
    enrichedWorks = await Promise.all(
      works.map(async (work) => {
        try {
          const fullDetails = await fetchWorkDetails(work.orcidId, work.putCode);
          return fullDetails ? { ...work, ...fullDetails } : work;
        } catch (error) {
          console.warn(`Failed to fetch details for work ${work.putCode}: ${error.message}`);
          return work;
        }
      })
    );
  }

  // Filter by work type first
  let filtered = filterWorksByType(enrichedWorks, workType);

  // Sort
  filtered = sortWorks(filtered, sortBy);

  // Apply limit
  if (limit) {
    filtered = filtered.slice(0, limit);
  }

  return filtered;
}

/**
 * Main function: Fetch all requested ORCID data
 */
async function fetchOrcidData(orcidId, sections = [], filters = {}) {
  if (!orcidId) {
    throw new Error("ORCID ID is required");
  }

  const result = {
    orcidId,
    fetchedAt: new Date().toISOString(),
    sections: {}
  };

  // If no sections specified, fetch all
  const requestedSections = sections.length === 0
    ? ["works", "education", "employment", "peer-review", "grants", "professional-activity"]
    : sections;

  try {
    const promises = [];

    if (requestedSections.includes("works")) {
      promises.push(
        fetchWorks(orcidId)
          .then(works => enrichWorks(works, { fetchDetails: true }))
          .then(works => {
            result.sections.works = works;
          })
      );
    }

    if (requestedSections.includes("education")) {
      promises.push(
        fetchEducation(orcidId).then(edu => {
          result.sections.education = edu;
        })
      );
    }

    if (requestedSections.includes("employment")) {
      promises.push(
        fetchEmployment(orcidId).then(emp => {
          result.sections.employment = emp;
        })
      );
    }

    if (requestedSections.includes("peer-review")) {
      promises.push(
        fetchPeerReviews(orcidId).then(reviews => {
          result.sections.peerReviews = reviews;
        })
      );
    }

    if (requestedSections.includes("grants")) {
      promises.push(
        fetchGrants(orcidId).then(grants => {
          result.sections.grants = grants;
        })
      );
    }

    if (requestedSections.includes("professional-activity")) {
      promises.push(
        fetchProfessionalActivities(orcidId).then(activities => {
          result.sections.professionalActivities = activities;
        })
      );
    }

    // Execute all fetches in parallel
    await Promise.all(promises);

    // Enrich works with full details if available
    if (result.sections.works && filters.workType) {
      result.sections.works = await enrichWorks(
        result.sections.works,
        filters
      );
    }

  } catch (error) {
    console.warn(`Error fetching ORCID data for ${orcidId}: ${error.message}`);
  }

  return result;
}

export {
  fetchOrcidData,
  fetchWorks,
  fetchEducation,
  fetchEmployment,
  fetchPeerReviews,
  fetchGrants,
  fetchProfessionalActivities,
  filterWorksByType,
  sortWorks,
  enrichWorks
};
