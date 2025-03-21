const { Client, Databases, ID, Query } = require("node-appwrite");
const { serializePlan, deserializePlan } = require("./shared"); // Import shared functions
const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT) // Set your Appwrite endpoint
  .setProject(process.env.APPWRITE_PROJECT_ID); // Set your project ID

const databases = new Databases(client);

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID; // Set your database ID
const PLANS_COLLECTION_ID = "67d96e5c000a8b7f622a"; // Collection ID for plans
const USERS_COLLECTION_ID = "67d96ed1000042986451"; // Collection ID for users

// Add utility functions for serialization are now in shared.js

async function createOrUpdateUserPlans(userId, planId) {
  try {
    // Try to get existing user document
    try {
      const existingUser = await databases.getDocument(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        userId
      );

      // User exists, update plans array
      const updatedPlans = existingUser.plans || [];
      updatedPlans.push(planId);
      console.log("updating User ", userId);
      await databases.updateDocument(DATABASE_ID, USERS_COLLECTION_ID, userId, {
        plans: updatedPlans,
      });
    } catch (error) {
      // User doesn't exist, create new document
      console.log("creating User ", userId);

      await databases.createDocument(DATABASE_ID, USERS_COLLECTION_ID, userId, {
        userId: userId,
        plans: [planId],
      });
    }
  } catch (error) {
    console.error("Appwrite Error:", error);
    throw new Error("Failed to update user plans");
  }
}

async function storePlan(userId, plan,goal,startDate,deadline) {
  try {
    const id = ID.unique();
    const planVal=""+plan
    // console.log("planData",planVal)
    // const serializedPlan = serializePlan(plan);
    const planData = {
      userId: userId,
      plan: planVal, // Serialize only if not already a string
      createdAt: new Date().toISOString(),
      name: goal+" "+startDate+" "+deadline
    };
    console.log("Storing plan:", id);

    const response = await databases.createDocument(
      DATABASE_ID,
      PLANS_COLLECTION_ID,
      id,
      planData
    );

    // Update user's plans list
    await createOrUpdateUserPlans(userId, id);

    return { response, id };
  } catch (error) {
    console.error("Appwrite Error:", error);
    throw new Error("Failed to store plan in database");
  }
}

async function updatePlan(planId, updatedPlan) {
  try {
    console.log("Updating plan:", planId);
    
    const serializedPlan = ""+updatedPlan;
    const data = { plan: serializedPlan };
    const response = await databases.updateDocument(
      DATABASE_ID,
      PLANS_COLLECTION_ID,
      planId,
      data
    );

    return response;
  } catch (error) {
    console.error("Appwrite Error:", error);
    throw new Error("Failed to update plan in database");
  }
}

async function getUserPlans(userId) {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      PLANS_COLLECTION_ID,
      [Query.equal("userId", userId)]
    );
    //fetch particular plan
    // const response = await databases.getDocument(DATABASE_ID, PLANS_COLLECTION_ID, planId);



    // Parse the plan field for each document
    return response.documents.map((doc) => ({
      ...doc,
      plan: doc.plan,
    }));
  } catch (error) {
    console.error("Appwrite Error:", error);
    throw new Error("Failed to fetch user plans");
  }
}

async function getPlan(planId) {
  try {
    console.log("Fetching plan with ID:", planId);

    // Fetch the document from the database using the planId
    const response = await databases.getDocument(
      DATABASE_ID,
      PLANS_COLLECTION_ID,
      planId
    );

    // Parse the plan field before returning
    return {
      ...response,
      plan: response.plan, // Parse the stringified JSON
    };
  } catch (error) {
    console.error("Appwrite Error:", error);
    throw new Error("Failed to fetch the plan");
  }
}

module.exports = {
  storePlan,
  updatePlan,
  getUserPlans,
  createOrUpdateUserPlans,
  getPlan,
};