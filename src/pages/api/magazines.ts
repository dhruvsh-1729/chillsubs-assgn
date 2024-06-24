import { NextApiRequest, NextApiResponse } from 'next';
import { genreOptions } from '../../utils/genreOptions';
import axios from 'axios';
import { magazineList } from '../../utils/fake_mags_data';

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
  country: string;
  yearFounded: number;
  readingPeriods: ReadingPeriod[];
  responseDays: string;
  simultaneousSubmissions: boolean;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { startDate, endDate } = req.query as { startDate: string; endDate: string };

  const genreMap = genreOptions.reduce<Record<number, string>>((acc, option: GenreOption) => {
    acc[option.id] = option.label;
    return acc;
  }, {});

  try {
    // Load the JSON data
    // const response = await axios.get(process.env.JSON_API_URL as string);
    // console.log({response:response.data});

    const magazines: any = magazineList;
    console.log({ startDate, deadlineStart: new Date(startDate), deadlineEnd: new Date(endDate) });


    // Filter magazines with deadlines between the given dates
    const normalizeDate = (date: Date) => {
      const normalized = new Date(date);
      normalized.setHours(0, 0, 0, 0);
      return normalized;
    };

    const filteredMagazines = magazines.filter((magazine: any) => {
      const deadline = normalizeDate(new Date(magazine.readingPeriods[0].deadline.$date));
      const start = normalizeDate(new Date(startDate));
      const end = normalizeDate(new Date(endDate));

      return deadline >= start && deadline <= end;
    });
    
    // Sort the filtered magazines by deadline date in increasing order
    const sortedMagazines = filteredMagazines.sort((a: any, b: any) => {
      const dateA = new Date(a.readingPeriods[0].deadline.$date);
      const dateB = new Date(b.readingPeriods[0].deadline.$date);
      return dateA.getTime() - dateB.getTime();
    });

    // Format the magazines for output
    const formattedMagazines = sortedMagazines.map((magazine: any) => {
      const genres = magazine.genres.map((genre: any) => genreMap[genre.optionId]).join(', ');
      return {
        name: magazine.name,
        deadline: new Date(magazine.readingPeriods[0].deadline.$date).toLocaleDateString(),
        theme: magazine.currentTheme,
        description: magazine.description,
        genres,
        country: magazine.country,
        yearFounded: magazine.yearFounded,
        responseDays: magazine.responseDays,
        simultaneousSubmissions: magazine.simultaneousSubmissions
      };
    });

    console.log({ formattedMagazines });


    res.status(200).json(formattedMagazines);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch data' });
  }
}
