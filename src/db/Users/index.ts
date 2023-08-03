import { getDatabase, writeDatabase } from "..";
import { User } from "./types";

export const addUser = async (user: User) => {
  const { id } = user;
  const db = await getDatabase();

  if (db.users[id]) {
    console.error();
    throw new Error('user already exist');
  }

  db.users[id] = user;
  await writeDatabase(db);
  console.log('USER CREATED');
};

export const deleteUser = async (id: string) => {
  const db = await getDatabase();
  if (!db.users[id]) {
    console.error('user not exists');
    return;
  }

  db.users = db.users.filter((user) => user.id !== id);
  await writeDatabase(db);
  console.log('USER DELETED');
};

export const getUser = async (id: number): Promise<User | undefined> => {
  const db = await getDatabase();
  if (!db.users[id]) {
    throw new Error('user not exists')
  }

  return db.users[id];
};

const addStatToUser = async (firstId: number, secondId: number, stat: 'wins' | 'loses') => {
  const db = await getDatabase();
  if (!db.users[firstId] || !db.users[secondId]) {
    throw new Error('user not exists')
  }
  console.log('ids for setting', firstId, secondId);

  const firstUser = db.users[firstId] as User;
  const secondUser = db.users[secondId] as User;
  const coupleWins = firstUser[stat][secondId];

  if (!coupleWins) {
    
    firstUser[stat][secondId] = 1;
    secondUser[stat][firstId] = 1;
    await writeDatabase(db);
    return;
  }
  firstUser[stat][secondId] += 1;
  secondUser[stat][firstId] += 1;
  await writeDatabase(db);
  return;
};

export const addWinToUsers = async (firstId: number, secondId: number) => await addStatToUser(firstId, secondId, 'wins');
export const addLoseToUsers = async (firstId: number, secondId: number) => await addStatToUser(firstId, secondId, 'loses');
