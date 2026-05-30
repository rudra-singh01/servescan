import type { MenuTemplate } from '@/lib/constants';

export type TemplateItem = {
  name: string;
  nameHi?: string;
  price: number;
  isVeg?: boolean;
};

export type TemplateCategory = {
  name: string;
  nameHi?: string;
  items: TemplateItem[];
};

export const MENU_TEMPLATE_DATA: Record<Exclude<MenuTemplate, 'custom'>, TemplateCategory[]> = {
  indian: [
    {
      name: 'Starters',
      nameHi: 'स्टार्टर',
      items: [
        { name: 'Paneer Tikka', nameHi: 'पनीर टिक्का', price: 220, isVeg: true },
        { name: 'Chicken Tikka', nameHi: 'चिकन टिक्का', price: 280, isVeg: false },
      ],
    },
    {
      name: 'Main Course',
      nameHi: 'मुख्य व्यंजन',
      items: [
        { name: 'Dal Makhani', nameHi: 'दाल मखनी', price: 180, isVeg: true },
        { name: 'Butter Chicken', nameHi: 'बटर चिकन', price: 320, isVeg: false },
        { name: 'Jeera Rice', nameHi: 'जीरा राइस', price: 120, isVeg: true },
      ],
    },
    {
      name: 'Beverages',
      nameHi: 'पेय',
      items: [
        { name: 'Sweet Lassi', nameHi: 'मीठी लस्सी', price: 60, isVeg: true },
        { name: 'Masala Chai', nameHi: 'मसाला चाय', price: 40, isVeg: true },
      ],
    },
  ],
  chinese: [
    {
      name: 'Soups',
      items: [
        { name: 'Hot & Sour Soup', price: 120, isVeg: true },
        { name: 'Chicken Corn Soup', price: 140, isVeg: false },
      ],
    },
    {
      name: 'Noodles & Rice',
      items: [
        { name: 'Veg Hakka Noodles', price: 180, isVeg: true },
        { name: 'Chicken Fried Rice', price: 220, isVeg: false },
      ],
    },
  ],
  'fast-food': [
    {
      name: 'Burgers',
      items: [
        { name: 'Veg Burger', price: 99, isVeg: true },
        { name: 'Chicken Burger', price: 149, isVeg: false },
      ],
    },
    {
      name: 'Sides',
      items: [
        { name: 'French Fries', price: 79, isVeg: true },
        { name: 'Cold Drink', price: 49, isVeg: true },
      ],
    },
  ],
  cafe: [
    {
      name: 'Coffee',
      items: [
        { name: 'Espresso', price: 120 },
        { name: 'Cappuccino', price: 150 },
        { name: 'Cold Brew', price: 180 },
      ],
    },
    {
      name: 'Pastries',
      items: [
        { name: 'Croissant', price: 90, isVeg: true },
        { name: 'Chocolate Muffin', price: 110, isVeg: true },
      ],
    },
  ],
  bakery: [
    {
      name: 'Breads',
      items: [
        { name: 'Sourdough Loaf', price: 180, isVeg: true },
        { name: 'Multigrain Bread', price: 120, isVeg: true },
      ],
    },
    {
      name: 'Cakes',
      items: [
        { name: 'Chocolate Truffle Slice', price: 150, isVeg: true },
        { name: 'Red Velvet Cupcake', price: 80, isVeg: true },
      ],
    },
  ],
};
