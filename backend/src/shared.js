function serializePlan(plan) {
  return JSON.stringify(plan);
}

function deserializePlan(planString) {
  try {
    return JSON.parse(planString);
  } catch (error) {
    console.error("Error deserializing plan:", error);
    return null;
  }
}

module.exports = {
  serializePlan,
  deserializePlan,
};