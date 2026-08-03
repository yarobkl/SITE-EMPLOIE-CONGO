const primaryProjectId = 'prj_4qu0pYW6yj73vIb0PPod5hr1j0YS';
const duplicateProjectIds = new Set([
  'prj_tIEIS7stCAZtGG1mcvXk09vreNT0',
  'prj_7rKM0tfJequLypk32Out3ALTTNLO',
]);

const projectId = process.env.VERCEL_PROJECT_ID || '';

// Vercel ignores a deployment when ignoreCommand exits with code 0.
// It continues the build when the command exits with code 1.
if (duplicateProjectIds.has(projectId)) {
  console.log(`Skipping duplicate Vercel project ${projectId}. Primary project: ${primaryProjectId}.`);
  process.exit(0);
}

console.log(projectId
  ? `Building primary or unrecognised Vercel project ${projectId}.`
  : 'VERCEL_PROJECT_ID unavailable; continuing the build safely.');
process.exit(1);
