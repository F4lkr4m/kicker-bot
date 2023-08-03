import fs from 'fs';


const readFile = async (filename: string) => new Promise((resolve, reject) => {
  fs.readFile(filename, ENCODING, (err, data) => {
    if (err) {
      console.error(err);
      reject(err);
    }

    resolve(JSON.parse(data));
  });
});

const writeFile = async (filename: string, data: any) => new Promise((resolve, reject) => {
  fs.writeFile(filename, JSON.stringify(data), ENCODING, (err) => {
    if (err) {
      reject(err);
    }
    resolve(null);
  })
});



const ENCODING = 'utf8';

export const getDatabase = async () => {
  try {
    const db = await readFile('./db.json');
    return db as any;
  } catch (error) {
    console.error(error);
  }
}

export const writeDatabase = async (data: any) => {
  try {
    await writeFile('./db.json', data);
    return;
  } catch (error) {
    console.error(error);
  }
}