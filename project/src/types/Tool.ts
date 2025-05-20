export interface Tool {
  id: string;
  name: string;
  description: string;
  tagline?: string;
  image: string;
  category: string;
  subjects: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  price: string;
  rating: number;
  website?: string;
}