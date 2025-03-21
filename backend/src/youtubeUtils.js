const { google } = require("googleapis");
const { deserializePlan, serializePlan } = require("./shared");
const { updatePlan } = require("./appwrite");
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID;
const PLANS_COLLECTION_ID = "67d96e5c000a8b7f622a"; // Replace with your actual collection ID
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const { Client, Databases } = require("node-appwrite");

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT) // Set your Appwrite endpoint
  .setProject(process.env.APPWRITE_PROJECT_ID); // Set your project ID

const databases = new Databases(client);

// Fetch YouTube playlists for a given topic
async function fetchYouTubePlaylists(topic) {
  try {
    console.log(`Fetching YouTube playlists for topic: ${topic}`);
    const youtube = google.youtube({
      version: "v3",
      auth: process.env.YOUTUBE_API_KEY, // Ensure this is set in your .env file
    });

    const response = await youtube.search.list({
      part: "snippet",
      q: topic,
      type: "playlist",
      maxResults: 1, // Fetch only the top result
    });

    const playlists = response.data.items.map((item) => {
      return `https://www.youtube.com/playlist?list=${item.id.playlistId}`;
    });

    console.log(`Fetched playlists for topic "${topic}":`, playlists);
    return playlists;
  } catch (error) {
    console.error(`Error fetching YouTube playlists for topic "${topic}":`, error.message);
    return [];
  }
}

// Add YouTube playlists to a study plan
async function addYouTubePlaylistsToPlan(planId) {
  try {
    console.log(`Fetching study plan for planId: ${planId}`);
    const planDocument = await databases.getDocument(DATABASE_ID, PLANS_COLLECTION_ID, planId);

    // Log the entire document to inspect its structure
    console.log("Fetched Plan Document:", JSON.stringify(planDocument, null, 2));
    planDocument.plan = planDocument.plan.replace(/```json/g, "").replace(/```/g, "");


    // Parse the plan field to handle both single-encoded and double-encoded JSON
    let plan = planDocument.plan;
    if (typeof plan === "string") {
      try {
        plan = JSON.parse(plan); // First parse
        if (typeof plan === "string") {
          plan = JSON.parse(plan); // Second parse if it's still a string
        }
      } catch (error) {
        throw new Error("Failed to parse the plan field as JSON.");
      }
    }

    if (!plan || !Array.isArray(plan)) {
      throw new Error("Invalid plan structure: Expected an array of weeks.");
    }

    console.log("Parsed Plan:", plan);

    // Fetch YouTube playlists for each topic
    for (const week of plan) {
      if (!week.Tasks || !Array.isArray(week.Tasks)) {
        console.warn(`Skipping invalid week structure: ${JSON.stringify(week)}`);
        continue;
      }

      for (const task of week.Tasks) {
        if (!task.Topic) {
          console.warn(`Skipping invalid task structure: ${JSON.stringify(task)}`);
          continue;
        }

        const playlists = await fetchYouTubePlaylists(task.Topic);
        task.YTplaylist = playlists.length > 0 ? playlists[0] : ""; // Add the first playlist URL or leave empty
        task.testTaken = false;
        task.testScore = 0;
        console.log(`Added playlist for topic "${task.Topic}":`, task.YTplaylist);
      }
    }

    // Update the plan in the database
    await updatePlan(planId, JSON.stringify(plan)); // Store the updated plan as a string

    console.log(`YouTube playlists added to plan ${planId}`);
  } catch (error) {
    console.error(`Error adding YouTube playlists to plan ${planId}:`, error.message);
    throw error;
  }
}

module.exports = {
  fetchYouTubePlaylists,
  addYouTubePlaylistsToPlan,
};