import { NextApiRequest, NextApiResponse } from 'next';
import { genreOptions } from '../../utils/genreOptions';
import axios from 'axios';

interface GenreOption {
  id: number;
  value: string;
  label: string;
}

interface ReadingPeriod {
  theme: string;
  deadline: {
    $date: string;
  };
}

interface Magazine {
  name: string;
  description: string;
  genres: {
    optionId: number;
  }[];
  currentTheme: string;
  country:string;
  yearFounded:number;
  readingPeriods: ReadingPeriod[];
  responseDays:string;
  simultaneousSubmissions: boolean;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { startDate, endDate } = req.query as { startDate: string; endDate: string };

  console.log({startDate, endDate});

  const genreMap = genreOptions.reduce<Record<number, string>>((acc, option: GenreOption) => {
    acc[option.id] = option.label;
    return acc;
  }, {});

  try {
    // Load the JSON data
    const response = await axios.get(process.env.JSON_API_URL as string);
    console.log({response});
    
    const magazines: Magazine[] = response.data;

    // Filter magazines with deadlines between the given dates
    const filteredMagazines = magazines.filter(magazine => {
      const deadline = new Date(magazine.readingPeriods[0].deadline.$date);
      return deadline >= new Date(startDate) && deadline <= new Date(endDate);
    });

    // Sort the filtered magazines by deadline date in increasing order
    const sortedMagazines = filteredMagazines.sort((a, b) => {
      const dateA = new Date(a.readingPeriods[0].deadline.$date);
      const dateB = new Date(b.readingPeriods[0].deadline.$date);
      return dateA.getTime() - dateB.getTime();
    });

    // Format the magazines for output
    const formattedMagazines = sortedMagazines.map(magazine => {
      const genres = magazine.genres.map(genre => genreMap[genre.optionId]).join(', ');
      return {
        name: magazine.name,
        deadline: new Date(magazine.readingPeriods[0].deadline.$date).toLocaleDateString(),
        theme: magazine.currentTheme,
        description: magazine.description,
        genres,
        country:magazine.country,
        yearFounded:magazine.yearFounded,
        responseDays:magazine.responseDays,
        simultaneousSubmissions:magazine.simultaneousSubmissions
      };
    });

    console.log({formattedMagazines});
    

    res.status(200).json(formattedMagazines);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch data' });
  }
}
