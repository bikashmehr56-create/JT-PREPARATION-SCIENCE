
import { Category, SyllabusSection } from './types';

export const SYLLABUS_DATA: Record<Category, SyllabusSection[]> = {
  [Category.CAT_I]: [
    {
      id: 'general_english',
      title: 'General English',
      marks: 20,
      description: 'Questions on comprehension, inference & grammar from unseen passage/poem.',
      topics: ['Comprehension', 'Grammar', 'Inference', 'Vocabulary']
    },
    {
      id: 'general_odia',
      title: 'General Odia',
      marks: 20,
      description: 'Questions on comprehension, inference & grammar from unseen passage/poem.',
      topics: ['Comprehension', 'Grammar', 'Inference', 'Vocabulary']
    },
    {
      id: 'gk_ca',
      title: 'General Knowledge & Current Affairs',
      marks: 20,
      description: 'Current events of state (Odisha), national and international importance.',
      topics: ['History of Odisha/India', 'Indian and World Geography', 'Indian Polity', 'Everyday Science']
    },
    {
      id: 'child_dev',
      title: 'Child Development & Learning',
      marks: 30,
      description: 'Understanding child development, learning process, inclusive context, and curriculum.',
      topics: ['Growth and Development', 'Inclusive Education', 'NCF 2005', 'Assessment Techniques']
    },
    {
      id: 'evs',
      title: 'Environmental Studies (EVS)',
      marks: 30,
      description: 'Methods and approaches of teaching EVS, Governance, Odisha history.',
      topics: ['Governance', 'Natural Resources', 'Freedom Struggle', 'Internal Systems of Human Body']
    }
  ],
  [Category.CAT_II]: [
    {
      id: 'child_dev_ii',
      title: 'Child Development & Learning',
      marks: 30,
      description: 'Understanding Child Development, Learning Process, Inclusive Context.',
      topics: ['Adolescence', 'Learning as meaning-making', 'Inclusive Education', 'RTE']
    },
    {
      id: 'social_studies',
      title: 'Social Studies (Arts Stream)',
      marks: 40,
      description: 'History, Political Science, and Geography.',
      topics: ['Sultanate, Moghul period', 'Indian Constitution', 'Odisha Geography', 'Natural Resources']
    },
    {
      id: 'physical_science',
      title: 'Physical Science (Science Stream)',
      marks: 40,
      description: 'Elements, Compounds, Chemical equations, Motion, Force.',
      topics: ['Metal & Non-metals', 'Acid, Base & Salt', 'Electricity', 'Solar System']
    },
    {
      id: 'biological_science',
      title: 'Biological Science (CBZ Stream)',
      marks: 40,
      description: 'Botany, Zoology, and Chemistry related to life sciences.',
      topics: ['Cell Structure and Function', 'Diversity of Life', 'Plant & Animal Physiology', 'Genetics & Evolution', 'Environmental Biology']
    }
  ]
};
