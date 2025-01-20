export default async function notProd(deps, testsCallback) {
  // Run tests only when the file is executed directly

  if (process.env.NODE_ENV !== "production") {
    deps = await Promise.all(deps.map((dep) => import(dep)));
    return testsCallback(...deps);
  }

  return void 0;
}
