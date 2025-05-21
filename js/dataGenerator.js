const firstNames = ['Alice', 'Bob', 'Charlie', 'Diana', 'Evan'];
const surnames = ['Smith', 'Johnson', 'Brown', 'Williams', 'Jones'];

let civilCounter = 100000000;

function randomDate(startYear = 1950, endYear = 2005) {
  const start = new Date(`${startYear}-01-01`).getTime();
  const end = new Date(`${endYear}-12-31`).getTime();
  const timestamp = Math.floor(Math.random() * (end - start)) + start;
  return new Date(timestamp);
}

export async function generateRecord() {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const surname = surnames[Math.floor(Math.random() * surnames.length)];
  const dob = randomDate();
  const civilNumber = (civilCounter++).toString().padStart(9, '0');
  return {
    name: `${firstName} ${surname}`,
    dob,
    civil: civilNumber
  };
}
