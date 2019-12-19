function updateSessionSteps(session, value) {
  const steps = new Set(session.steps);
  steps.add(value);
  return [...steps];
}

export default updateSessionSteps;
