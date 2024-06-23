// pages/index.tsx

import axios from 'axios';
import styles from '../styles/Home.module.css';
import { GetServerSideProps } from 'next';

interface Magazine {
  name: string;
  deadline: string;
  theme?: string;
  description: string;
  genres: string;
  country?: string;
  yearFounded?: number;
  responseDays:number;
  simultaneousSubmissions: boolean;
}

interface HomeProps {
  initialMagazines: Magazine[];
}

export default function Home({ initialMagazines }: HomeProps) {
  const downloadHtml = (initialMagazines: Magazine[]) => {
    const content = `
      <html>
        <head>
          <title>Last Chance to Submit</title>
          <style>
            body { font-family: Arial, sans-serif; }
            .magazine { margin-bottom: 20px; }
            .magazine h3 { margin: 0; }
            .magazine p { margin: 5px 0; }
          </style>
        </head>
        <body>
          <h1>Last Chance to Submit</h1>
          ${initialMagazines.map(magazine => `
            <div class="magazine">
              <h3>${magazine.name} | Deadline: ${magazine.deadline} ${magazine.theme ? `| Theme: ${magazine.theme}` : ''}</h3>
              ${magazine.country && magazine.yearFounded && magazine.genres ? `
                <p>${magazine.country}-based literary magazine founded in ${magazine.yearFounded} that publishes ${magazine.genres}.</p>
              ` : ''}
              <p><i>${magazine.description}</i></p>
              <p>${magazine.simultaneousSubmissions ? 'Accepts simultaneous submissions. ' : 'Does not accept simultaneous submissions. '} Respond within ${magazine.responseDays} days</p>
            </div>
          `).join('')}
        </body>
      </html>
    `;
    const blob = new Blob([content], { type: 'text/html' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'last-chance-to-submit.html';
    link.click();
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Where to Submit - the next week</h1>
      <button className={styles.downloadButton} onClick={() => downloadHtml(initialMagazines)}>
        Download list
      </button>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  let initialMagazines: Magazine[] = [];

  try {

    //logic for filtering deadlines in the next week from Monday to Sunday
    // const today = new Date();
    // const nextMonday = new Date(today);
    // nextMonday.setDate(today.getDate() + ((8 - today.getDay()) % 7 || 7));
    // const nextSunday = new Date(nextMonday);
    // nextSunday.setDate(nextSunday.getDate() + 6);


    //logic for filtering deadlines in the same week, doing this right now since the data does not have any 
    // magazines having deadlines next week.
    const nextMonday = new Date();
    nextMonday.setDate(nextMonday.getDate() + ((1 + 7 - nextMonday.getDay()) % 7));
    const nextSunday = new Date(nextMonday);
    nextSunday.setDate(nextSunday.getDate() + 6);

    const baseUrl = process.env.NODE_ENV==='production' ? `https://chillsubs-assgn.vercel.app/` : 'http://localhost:3000';
    const apiUrl = `${baseUrl}/api/magazines`; // Adjust as per your API route

    const response = await axios.get<Magazine[]>(apiUrl, { // Update URL as needed
      params: {
        startDate: nextMonday.toISOString(),
        endDate: nextSunday.toISOString()
      }
    });

    initialMagazines = response.data;
   // console.log({initialMagazines});
    
  } catch (error) {
    console.error('Failed to fetch magazines during server-side rendering', error);
  }

  return {
    props: {
      initialMagazines,
    },
  };
};
