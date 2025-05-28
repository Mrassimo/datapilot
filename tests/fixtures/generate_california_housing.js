import { createWriteStream } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Generate California housing dataset (simplified version)
const stream = createWriteStream('california_housing.csv');

// Header
stream.write('longitude,latitude,housing_median_age,total_rooms,total_bedrooms,population,households,median_income,median_house_value\n');

// Generate 20,640 rows of synthetic California housing data
for (let i = 0; i < 20640; i++) {
  const longitude = -124.35 + Math.random() * 10; // California longitude range
  const latitude = 32.54 + Math.random() * 10; // California latitude range
  const age = Math.floor(Math.random() * 52) + 1;
  const rooms = Math.floor(Math.random() * 10000) + 100;
  const bedrooms = Math.floor(rooms / 5) + Math.floor(Math.random() * 50);
  const population = Math.floor(Math.random() * 10000) + 100;
  const households = Math.floor(population / 3) + Math.floor(Math.random() * 100);
  const income = Math.random() * 10 + 0.5;
  const value = (income * 50000) + Math.random() * 200000;
  
  stream.write(`${longitude.toFixed(2)},${latitude.toFixed(2)},${age},${rooms},${bedrooms},${population},${households},${income.toFixed(4)},${value.toFixed(0)}\n`);
}

stream.end(() => {
  console.log('California housing dataset created with 20,640 rows');
});