export function fail(error: Error) {
  return () => {
    throw error;
  };
}
