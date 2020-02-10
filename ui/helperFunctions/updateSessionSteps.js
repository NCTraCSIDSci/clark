function updateSessionSteps(sessionSteps, value) {
  const steps = new Set(sessionSteps);
  value.forEach((val) => {
    steps.add(val);
  });
  return [...steps];
}

export default updateSessionSteps;
