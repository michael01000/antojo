import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const db = new PrismaClient();

function hash(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const h = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${h}`;
}
const DEMO_PASSWORD = hash("antojo123");

const IMG = {
  burger: "https://sfile.chatglm.cn/images-ppt/e7bc8c902f79.jpg",
  pizza: "https://sfile.chatglm.cn/images-ppt/6437044a5039.jpg",
  pollo: "https://sfile.chatglm.cn/images-ppt/d6cc7d62b2e3.jpg",
  sushi: "https://sfile.chatglm.cn/images-ppt/1a2f11106c7f.jpg",
  arepa: "https://sfile.chatglm.cn/images-ppt/025ad4dd39e6.jpg",
  pasta: "https://sfile.chatglm.cn/images-ppt/afaa243e201f.jpg",
  bowl: "https://sfile.chatglm.cn/images-ppt/5dc7fd95f01e.jpg",
  postre: "https://sfile.chatglm.cn/images-ppt/23962e39f58f.jpg",
  cafe: "https://sfile.chatglm.cn/images-ppt/ef253f3ee2e9.jpg",
  tacos: "https://sfile.chatglm.cn/images-ppt/1ed5211820fa.jpg",
  nachos: "https://sfile.chatglm.cn/images-ppt/4e72e26fcfe3.jpg",
  milkshake: "https://sfile.chatglm.cn/images-ppt/265c18d505d7.jpg",
  salad: "https://sfile.chatglm.cn/images-ppt/30e95b4a77e4.jpg",
  wings: "https://sfile.chatglm.cn/images-ppt/b08d14028eb2.jpg",
};

const restaurants = [
  {
    name: "El Corral Gourmet",
    slug: "el-corral-gourmet",
    description: "Hamburguesas premium con carne 100% colombiana, maduradas y a la parrilla.",
    cuisine: "Hamburguesas",
    neighborhood: "Zona G",
    rating: 4.8, reviewCount: 2143, deliveryFee: 3900, deliveryMin: 22, priceLevel: 3,
    imageUrl: IMG.burger, coverColor: "antojo", accentColor: "antojo",
    promo: "2x1 en clásicas", tags: "hamburguesa,parrilla,carne",
    menu: [
      { cat: "Hamburguesas", items: [
        { name: "Corral Clásica", desc: "Carne 150g, queso cheddar, lechuga, tomate, salsa de la casa", price: 18500, emoji: "🍔", popular: true, cal: 620, prep: 12, tags: "top" },
        { name: "Big Doble Bacon", desc: "Doble carne 300g, tocino crujiente, doble queso, cebolla caramelizada", price: 26900, emoji: "🍔", popular: true, cal: 890, prep: 14, tags: "top" },
        { name: "Pollo Crispy", desc: "Filete de pollo apanado, queso, pepinillos, salsa alioli", price: 19900, emoji: "🍔", cal: 540, prep: 11 },
        { name: "Vegetal del Huerto", desc: "Medallón de lentejas y quinoa, aguacate, rúcula, tomate seco", price: 21500, emoji: "🥬", cal: 410, prep: 12, tags: "vegano" },
      ]},
      { cat: "Acompañamientos", items: [
        { name: "Papas Andrés", desc: "Papas rústicas con piel, romero y parmesano", price: 9900, emoji: "🍟", popular: true, cal: 380, prep: 8 },
        { name: "Aros de Cebolla", desc: "Cebolla apanada con salsa BBQ", price: 8900, emoji: "🧅", cal: 320, prep: 8 },
        { name: "Alitas BBQ x6", desc: "Alitas glaseadas con BBQ de la casa", price: 14900, emoji: "🍗", cal: 510, prep: 14 },
      ]},
      { cat: "Bebidas", items: [
        { name: "Milkshake de Oreo", desc: "Batido cremoso de galleta Oreo con crema", price: 11500, emoji: "🥤", popular: true, cal: 480, prep: 5 },
        { name: "Limonada de Coco", desc: "Limón, coco y hielo frappé", price: 7900, emoji: "🥥", cal: 220, prep: 4 },
        { name: "Coca-Cola 350ml", desc: "Lata helada", price: 4500, emoji: "🥫", cal: 140, prep: 1 },
      ]},
    ],
  },
  {
    name: "Pizzería 900°",
    slug: "pizzeria-900",
    description: "Pizza napolitana en horno a leña a 900°. Masa de fermentación natural 48h.",
    cuisine: "Pizza italiana",
    neighborhood: "Chapinero",
    rating: 4.7, reviewCount: 1587, deliveryFee: 3500, deliveryMin: 28, priceLevel: 2,
    imageUrl: IMG.pizza, coverColor: "mora", accentColor: "mora",
    promo: "30% off enMedianas", tags: "pizza,italiana,leña",
    menu: [
      { cat: "Pizzas", items: [
        { name: "Margherita DOP", desc: "Tomate San Marzano, mozzarella fior di latte, albahaca", price: 24900, emoji: "🍕", popular: true, cal: 720, prep: 18, tags: "top" },
        { name: "Pepperoni Clásica", desc: "Mozzarella, pepperoni picante, orégano", price: 28900, emoji: "🍕", popular: true, cal: 880, prep: 18 },
        { name: "Quattro Formaggi", desc: "Mozzarella, gorgonzola, parmesano, fontina", price: 31900, emoji: "🧀", cal: 940, prep: 18 },
        { name: "Prosciutto e Funghi", desc: "Jamón crudo, champiñones, mozzarella", price: 32900, emoji: "🍕", cal: 860, prep: 18 },
      ]},
      { cat: "Entradas", items: [
        { name: "Bruschetta x4", desc: "Pan tostado, tomate, ajo, albahaca, aceite de oliva", price: 11900, emoji: "🍞", cal: 280, prep: 8 },
        { name: "Caprese", desc: "Tomate, mozzarella fresca, pesto, albahaca", price: 14900, emoji: "🍅", cal: 320, prep: 6 },
      ]},
      { cat: "Pasta", items: [
        { name: "Spaghetti Carbonara", desc: "Panceta, yema, pecorino, pimienta", price: 18900, emoji: "🍝", popular: true, cal: 680, prep: 14 },
        { name: "Lasaña Boloñesa", desc: "Capas de pasta, ragú, bechamel, parmesano", price: 21900, emoji: "🍝", cal: 760, prep: 16 },
      ]},
    ],
  },
  {
    name: "Pollo Frío Crispy",
    slug: "pollo-frio",
    description: "El pollo apanado más crujiente de Bogotá. Receta secreta con 11 especias.",
    cuisine: "Pollo",
    neighborhood: "Teusaquillo",
    rating: 4.5, reviewCount: 3201, deliveryFee: 2900, deliveryMin: 18, priceLevel: 1,
    imageUrl: IMG.pollo, coverColor: "mango", accentColor: "mango",
    promo: "Combo familiar -25%", tags: "pollo,combo,familiar",
    menu: [
      { cat: "Combos", items: [
        { name: "Combo Personal", desc: "1/4 pollo, papas, ensalada y bebida", price: 14900, emoji: "🍗", popular: true, cal: 720, prep: 10 },
        { name: "Combo Dúo", desc: "1/2 pollo, 2 papas, 2 bebidas", price: 26900, emoji: "🍗", popular: true, cal: 1280, prep: 12 },
        { name: "Combo Familiar", desc: "Pollo entero, 3 papas, 4 bebidas, 2 ensaladas", price: 54900, emoji: "🍗", cal: 2800, prep: 15 },
      ]},
      { cat: "Alitas", items: [
        { name: "Alitas BBQ x8", desc: "Glaseadas con BBQ de la casa", price: 17900, emoji: "🍗", popular: true, cal: 680, prep: 12 },
        { name: "Alitas Bufalo x8", desc: "Salsa picante estilo buffalo con aderezo azul", price: 17900, emoji: "🌶️", cal: 680, prep: 12, tags: "picante" },
        { name: "Alitas Miel Mostaza x8", desc: "Dulce y suave", price: 17900, emoji: "🍗", cal: 700, prep: 12 },
      ]},
      { cat: "Extras", items: [
        { name: "Papas Grandes", desc: "Crispy fries con sal de la casa", price: 6900, emoji: "🍟", cal: 360, prep: 7 },
        { name: "Ensalada Cole Slaw", desc: "Repollo, zanahoria, aderezo cremoso", price: 5900, emoji: "🥗", cal: 180, prep: 4 },
        { name: "Arepa de choclo", desc: "Arepa dulce de maíz", price: 3900, emoji: "🌽", cal: 220, prep: 5 },
      ]},
    ],
  },
  {
    name: "Sushi Roll Express",
    slug: "sushi-roll",
    description: "Sushi fresco hecho al momento. Pescado importado y arroz koshihikari.",
    cuisine: "Japonesa · Sushi",
    neighborhood: "Usaquén",
    rating: 4.7, reviewCount: 982, deliveryFee: 4500, deliveryMin: 30, priceLevel: 3,
    imageUrl: IMG.sushi, coverColor: "lima", accentColor: "lima",
    promo: null, tags: "sushi,japones,saludable",
    menu: [
      { cat: "Rolls Especiales", items: [
        { name: "Dragon Roll", desc: "Ebi tempura, aguacate, anguila unagi, salsa sweet chili", price: 28900, emoji: "🐉", popular: true, cal: 480, prep: 15, tags: "top" },
        { name: "Philadelphia Roll", desc: "Salmón, queso crema, aguacate, sésamo", price: 22900, emoji: "🍣", popular: true, cal: 380, prep: 12 },
        { name: "California Roll", desc: "Kanikama, aguacate, pepino, sésamo", price: 17900, emoji: "🍣", cal: 320, prep: 10 },
        { name: "Rainbow Roll", desc: "Ebi tempura cubierto con sashimi variado", price: 32900, emoji: "🌈", cal: 520, prep: 16 },
      ]},
      { cat: "Nigiri", items: [
        { name: "Nigiri Salmón x2", desc: "Arroz y sashimi de salmón fresco", price: 12900, emoji: "🍣", popular: true, cal: 180, prep: 8 },
        { name: "Niguri Atún x2", desc: "Arroz y sashimi de atún rojo", price: 13900, emoji: "🍣", cal: 170, prep: 8 },
      ]},
      { cat: "Entradas", items: [
        { name: "Edamame", desc: "Habas de soja al vapor con sal marina", price: 8900, emoji: "🫛", cal: 180, prep: 6, tags: "vegano" },
        { name: "Gyozas x6", desc: "Dumplings de cerdo al vapor con salsa de soya", price: 15900, emoji: "🥟", cal: 340, prep: 12 },
      ]},
    ],
  },
  {
    name: "Arepa & Co",
    slug: "arepa-co",
    description: "Lo mejor de la comida colombiana. Arepas, ajiaco, bandeja y más.",
    cuisine: "Comida colombiana",
    neighborhood: "La Candelaria",
    rating: 4.9, reviewCount: 1845, deliveryFee: 3500, deliveryMin: 25, priceLevel: 2,
    imageUrl: IMG.arepa, coverColor: "mango", accentColor: "mango",
    promo: "Bandeja paisa gigante", tags: "colombiana,tradicional,arepa",
    menu: [
      { cat: "Platos fuertes", items: [
        { name: "Bandeja Paisa", desc: "Frijoles, arroz, chicharrón, carne molida, chorizo, huevo, arepa, plátano, aguacate", price: 28900, emoji: "🍛", popular: true, cal: 1450, prep: 18, tags: "top" },
        { name: "Ajiaco Santafereño", desc: "Sopa de tres papas, pollo desmechado, guascas, crema, alcaparras", price: 21900, emoji: "🍲", popular: true, cal: 620, prep: 16 },
        { name: "Sancocho Trifásico", desc: "Res, cerdo y gallina con yuca, plátano y mazorca", price: 24900, emoji: "🍲", cal: 720, prep: 20 },
        { name: "Lechona Tolimense", desc: "Lechona con mote, insulso y limón", price: 19900, emoji: "🥘", cal: 580, prep: 10 },
      ]},
      { cat: "Arepas", items: [
        { name: "Arepa con Queso", desc: "Arepa asada rellena de queso costeño", price: 6900, emoji: "🌽", popular: true, cal: 320, prep: 6 },
        { name: "Arepa de Choclo", desc: "Arepa dulce de maíz con queso", price: 7900, emoji: "🌽", cal: 380, prep: 7 },
        { name: "Arepa Boyacense", desc: "Arepa con queso y cuajada", price: 8900, emoji: "🌽", cal: 410, prep: 7 },
      ]},
      { cat: "Bebidas", items: [
        { name: "Chocolate Santafereño", desc: "Chocolate caliente con queso y pan", price: 8900, emoji: "☕", cal: 280, prep: 6 },
        { name: "Aguapanela con Limón", desc: "Bebida caliente de panela y limón", price: 4900, emoji: "🍋", cal: 120, prep: 4 },
      ]},
    ],
  },
  {
    name: "Mondo Pasta",
    slug: "mondo-pasta",
    description: "Pasta fresca hecha en casa. Salsas clásicas y creativas.",
    cuisine: "Italiana",
    neighborhood: "Chapinero",
    rating: 4.6, reviewCount: 754, deliveryFee: 3500, deliveryMin: 26, priceLevel: 2,
    imageUrl: IMG.pasta, coverColor: "cafe", accentColor: "cafe",
    promo: "Pasta + vino -20%", tags: "pasta,italiana",
    menu: [
      { cat: "Pasta", items: [
        { name: "Carbonara", desc: "Spaghetti, panceta, yema, pecorino, pimienta negra", price: 19900, emoji: "🍝", popular: true, cal: 680, prep: 14 },
        { name: "Boloñesa", desc: "Tagliatelle con ragú de res de 6 horas", price: 21900, emoji: "🍝", popular: true, cal: 740, prep: 14 },
        { name: "Alfredo con Pollo", desc: "Fettuccine, crema, parmesano, pollo grillé", price: 22900, emoji: "🍝", cal: 820, prep: 14 },
        { name: "Pesto Genovés", desc: "Trofie, pesto de albahaca, piñones, parmesano", price: 20900, emoji: "🌿", cal: 610, prep: 12, tags: "vegano" },
      ]},
      { cat: "Entradas", items: [
        { name: "Pan de ajo", desc: "Focaccia con mantequilla de ajo y perejil", price: 7900, emoji: "🥖", cal: 320, prep: 7 },
        { name: "Tabla de quesos", desc: "Selección de quesos con miel y nueces", price: 18900, emoji: "🧀", cal: 540, prep: 8 },
      ]},
    ],
  },
  {
    name: "Green Bowl Healthy",
    slug: "green-bowl",
    description: "Bowls saludables, ensaladas y jugos. Come rico, come limpio.",
    cuisine: "Saludable",
    neighborhood: "El Poblado",
    rating: 4.8, reviewCount: 612, deliveryFee: 3200, deliveryMin: 20, priceLevel: 2,
    imageUrl: IMG.bowl, coverColor: "lima", accentColor: "lima",
    promo: "2x1 en bowls antes de 2pm", tags: "saludable,vegano,bowl,keto",
    menu: [
      { cat: "Bowls", items: [
        { name: "Bowl Poke Salmón", desc: "Arroz integral, salmón, edamame, aguacate, pepino, salsa teriyaki", price: 24900, emoji: "🥗", popular: true, cal: 520, prep: 12, tags: "top" },
        { name: "Bowl Pollo Fit", desc: "Quinoa, pollo grillé, brócoli, batata, aderezo de yogur", price: 21900, emoji: "🥗", popular: true, cal: 480, prep: 12 },
        { name: "Bowl Buddha", desc: "Arroz integral, garbanzos, aguacate, zanahoria, kale, tahini", price: 20900, emoji: "🧘", cal: 440, prep: 12, tags: "vegano" },
        { name: "Bowl Keto", desc: "Mix de hojas, huevo, tocino, aguacate, queso, aderezo ranch", price: 22900, emoji: "🥗", cal: 510, prep: 10, tags: "keto" },
      ]},
      { cat: "Jugos & Smoothies", items: [
        { name: "Green Detox", desc: "Espárrago, apio, manzana, jengibre, limón", price: 9900, emoji: "🥬", cal: 140, prep: 5 },
        { name: "Smoothie Tropical", desc: "Mango, maracuyá, plátano, leche de almendras", price: 10900, emoji: "🥭", popular: true, cal: 220, prep: 5 },
      ]},
    ],
  },
  {
    name: "Dulce Pecado",
    slug: "dulce-pecado",
    description: "Postres de autor. Tortas, cheesecakes y el mejor brownie de Bogotá.",
    cuisine: "Postres",
    neighborhood: "Zona G",
    rating: 4.9, reviewCount: 1124, deliveryFee: 3900, deliveryMin: 24, priceLevel: 2,
    imageUrl: IMG.postre, coverColor: "mora", accentColor: "mora",
    promo: "Postre gratis +$30.000", tags: "postre,torta,chocolate",
    menu: [
      { cat: "Postres", items: [
        { name: "Volcán de Chocolate", desc: "Bizcocho tibio con centro líquido, helado de vainilla", price: 13900, emoji: "🍫", popular: true, cal: 540, prep: 10, tags: "top" },
        { name: "Cheesecake Frutos Rojos", desc: "Cheesecake neoyorquino con coulis de frutos rojos", price: 14900, emoji: "🍰", popular: true, cal: 480, prep: 8 },
        { name: "Brownie con Nuez", desc: "Brownie denso con nuez y helado", price: 12900, emoji: "🍫", cal: 520, prep: 8 },
        { name: "Tiramisú", desc: "Clásico italiano con café espresso y mascarpone", price: 13900, emoji: "☕", cal: 420, prep: 8 },
      ]},
      { cat: "Bebidas", items: [
        { name: "Café Espresso", desc: "Doble shot de café colombiano", price: 4500, emoji: "☕", cal: 5, prep: 3 },
        { name: "Té Chai Latte", desc: "Chai especiado con leche vaporizada", price: 7900, emoji: "🫖", cal: 180, prep: 5 },
      ]},
    ],
  },
  {
    name: "Café Devoción",
    slug: "cafe-devocion",
    description: "Café de origen colombiano tostado en finca. El mejor de Bogotá.",
    cuisine: "Café",
    neighborhood: "Chapinero",
    rating: 4.7, reviewCount: 856, deliveryFee: 2900, deliveryMin: 18, priceLevel: 2,
    imageUrl: IMG.cafe, coverColor: "cafe", accentColor: "cafe",
    promo: "Combo café + croissant", tags: "cafe,desayuno,colombiano",
    menu: [
      { cat: "Café", items: [
        { name: "Latte de la Casa", desc: "Doble espresso, leche vaporizada, arte latte", price: 8900, emoji: "☕", popular: true, cal: 180, prep: 5 },
        { name: "Capuccino", desc: "Espresso, leche vaporizada, espuma", price: 8900, emoji: "☕", popular: true, cal: 150, prep: 5 },
        { name: "V60 origen Huila", desc: "Café filtrado de origen, notas frutales", price: 11900, emoji: "☕", cal: 5, prep: 6 },
        { name: "Cold Brew", desc: "Café extraído en frío 18h, suave y dulce", price: 10900, emoji: "🧊", cal: 10, prep: 4 },
      ]},
      { cat: "Acompañamientos", items: [
        { name: "Croissant de Mantequilla", desc: "Hojaldre francés recién horneado", price: 6900, emoji: "🥐", popular: true, cal: 280, prep: 4 },
        { name: "Almojábana", desc: "Pan de queso colombiano", price: 3900, emoji: "🧀", cal: 180, prep: 3 },
        { name: "Torta de Zanahoria", desc: "Con crema de queso", price: 9900, emoji: "🥕", cal: 420, prep: 5 },
      ]},
    ],
  },
  {
    name: "Taco Loco Cantina",
    slug: "taco-loco",
    description: "Tacos al pastor, mexican street food y los mejores margaritas.",
    cuisine: "Mexicana",
    neighborhood: "Zona G",
    rating: 4.6, reviewCount: 1043, deliveryFee: 3900, deliveryMin: 26, priceLevel: 2,
    imageUrl: IMG.tacos, coverColor: "lima", accentColor: "lima",
    promo: "Martes de tacos 3x2", tags: "mexicana,tacos,picante",
    menu: [
      { cat: "Tacos", items: [
        { name: "Al Pastor x3", desc: "Cerdo marinado, piña, cilantro, cebolla, salsa roja", price: 16900, emoji: "🌮", popular: true, cal: 480, prep: 12, tags: "top" },
        { name: "Carnitas x3", desc: "Cerdo confitado, cebolla, cilantro, salsa verde", price: 17900, emoji: "🌮", popular: true, cal: 520, prep: 12 },
        { name: "Suadero x3", desc: "Res braseada, guacamole, cebolla, cilantro", price: 18900, emoji: "🌮", cal: 540, prep: 12 },
        { name: "Fajita Veggie x3", desc: "Pimientos, cebolla, champiñones, frijoles, guac", price: 16900, emoji: "🌮", cal: 380, prep: 12, tags: "vegano" },
      ]},
      { cat: "Para compartir", items: [
        { name: "Nachos Supremos", desc: "Totopos, queso, frijoles, guacamole, pico de gallo, crema", price: 19900, emoji: "🧀", popular: true, cal: 780, prep: 12 },
        { name: "Quesadilla", desc: "Tortilla grande, queso fundido, pollo o champiñones", price: 15900, emoji: "🫓", cal: 520, prep: 10 },
        { name: "Guacamole & Totopos", desc: "Guac fresco con totopos crujientes", price: 12900, emoji: "🥑", cal: 380, prep: 8 },
      ]},
      { cat: "Bebidas", items: [
        { name: "Margarita Clásica", desc: "Tequila, limón, triple sec, sal", price: 15900, emoji: "🍹", popular: true, cal: 220, prep: 5 },
        { name: "Agua de Jamaica", desc: "Hibisco frío endulzado", price: 5900, emoji: "🌺", cal: 90, prep: 3 },
      ]},
    ],
  },
];

const driversSeed = [
  { name: "Andrés Gómez", vehicle: "Moto", rating: 4.9, avatarColor: "lima", isOnline: true, earningsToday: 42500, completedToday: 6 },
  { name: "María Fernanda Ruiz", vehicle: "Moto", rating: 5.0, avatarColor: "mora", isOnline: true, earningsToday: 58200, completedToday: 8 },
  { name: "Carlos Pineda", vehicle: "Bicicleta", rating: 4.8, avatarColor: "mango", isOnline: false, earningsToday: 18900, completedToday: 3 },
  { name: "Luisa Marín", vehicle: "Moto", rating: 4.9, avatarColor: "antojo", isOnline: true, earningsToday: 33400, completedToday: 5 },
  { name: "Diego Torres", vehicle: "Moto", rating: 4.7, avatarColor: "cafe", isOnline: false, earningsToday: 9800, completedToday: 1 },
];

const promotions = [
  { code: "BIENVENIDA10", title: "10% de bienvenida", description: "Tu primer pedido con 10% de descuento", type: "percent", value: 10, minOrder: 15000, uses: 4218 },
  { code: "ANTOJO20", title: "20% en tu antojo", description: "Descuento de 20% en pedidos +$30.000", type: "percent", value: 20, minOrder: 30000, uses: 1842 },
  { code: "ENVIO0", title: "Envío gratis", description: "Sin costo de envío en tu pedido", type: "free_delivery", value: 0, minOrder: 20000, uses: 5610 },
  { code: "MERIENDA5", title: "$5.000 off merienda", description: "Descuento fijo de $5.000", type: "fixed", value: 5000, minOrder: 12000, uses: 2987 },
];

const challenges = [
  { id: "c1", title: "Racha de 3 pedidos", description: "Pide 3 veces esta semana", progress: 2, goal: 3, reward: 200, icon: "🔥" },
  { id: "c2", title: "Explora sabores", description: "Prueba 2 restaurantes nuevos", progress: 1, goal: 2, reward: 150, icon: "🌍" },
  { id: "c3", title: "Cliente Prime", description: "Mantén tu suscripción activa", progress: 1, goal: 1, reward: 500, icon: "👑" },
  { id: "c4", title: "Foodie del fin de semana", description: "Pide sábado y domingo", progress: 0, goal: 2, reward: 300, icon: "🎉" },
];

async function main() {
  console.log("Seeding Antojo…");
  // wipe
  await db.notification.deleteMany();
  await db.favorite.deleteMany();
  await db.review.deleteMany();
  await db.chatMessage.deleteMany();
  await db.orderEvent.deleteMany();
  await db.orderItem.deleteMany();
  await db.order.deleteMany();
  await db.menuItem.deleteMany();
  await db.restaurant.deleteMany();
  await db.driver.deleteMany();
  await db.promotion.deleteMany();
  await db.groupOrder.deleteMany();
  await db.loyaltyAccount.deleteMany();
  await db.subscription.deleteMany();
  await db.address.deleteMany();
  await db.customer.deleteMany();
  await db.user.deleteMany();

  // ---------- Auth users (one per role) ----------
  const customerUser = await db.user.create({ data: { email: "cliente@antojo.co", password: DEMO_PASSWORD, name: "Valentina Ríos", role: "cliente", avatarColor: "antojo", city: "Bogotá", provider: "email", verified: true } });
  const driverUser = await db.user.create({ data: { email: "domiciliario@antojo.co", password: DEMO_PASSWORD, name: "Andrés Gómez", role: "domiciliario", avatarColor: "lima", city: "Bogotá", provider: "email", verified: true } });
  const restaurantUser = await db.user.create({ data: { email: "restaurante@antojo.co", password: DEMO_PASSWORD, name: "Sushi Roll Express", role: "restaurante", avatarColor: "lima", city: "Bogotá", provider: "email", verified: true } });
  const adminUser = await db.user.create({ data: { email: "admin@antojo.co", password: DEMO_PASSWORD, name: "Admin Antojo", role: "admin", avatarColor: "mora", city: "Bogotá", provider: "email", verified: true } });

  // Customer
  const customer = await db.customer.create({
    data: {
      userId: customerUser.id,
      name: "Valentina Ríos",
      email: "valentina@antojo.co",
      phone: "+57 310 555 1234",
      city: "Bogotá",
      avatarColor: "antojo",
      addresses: { create: [
        { label: "Casa", street: "Calle 72 #11-25, Chapinero", details: "Apto 402", lat: 4.6521, lng: -74.0635 },
        { label: "Trabajo", street: "Av. Chile #100-30", details: "Piso 8", lat: 4.6762, lng: -74.0521 },
      ]},
    },
  });

  await db.loyaltyAccount.create({
    data: {
      customerId: customer.id,
      coins: 1240,
      tier: "Oro",
      streakDays: 4,
      challengesJson: JSON.stringify(challenges),
    },
  });
  await db.subscription.create({
    data: { customerId: customer.id, plan: "prime", status: "active", renewsAt: new Date(Date.now() + 1000*60*60*24*18) },
  });

  // Restaurants + menu (sushi = index 3 linked to restaurant auth user)
  const restaurantIds: string[] = [];
  for (let ri = 0; ri < restaurants.length; ri++) {
    const r = restaurants[ri];
    const created = await db.restaurant.create({
      data: {
        name: r.name,
        slug: r.slug,
        description: r.description,
        cuisine: r.cuisine,
        neighborhood: r.neighborhood,
        rating: r.rating,
        reviewCount: r.reviewCount,
        deliveryFee: r.deliveryFee,
        deliveryMin: r.deliveryMin,
        priceLevel: r.priceLevel,
        imageUrl: r.imageUrl,
        coverColor: r.coverColor,
        accentColor: r.accentColor,
        promo: r.promo ?? null,
        tags: r.tags,
        isOpen: true,
        isApproved: true,
        userId: ri === 3 ? restaurantUser.id : null,
        ownerName: ri === 3 ? "Hiro Tanaka" : null,
        ownerPhone: ri === 3 ? "+57 320 555 9090" : null,
      },
    });
    restaurantIds.push(created.id);
    for (const section of r.menu) {
      for (const it of section.items) {
        await db.menuItem.create({
          data: {
            restaurantId: created.id,
            name: it.name,
            description: it.desc,
            price: it.price,
            category: section.cat,
            emoji: it.emoji ?? null,
            isPopular: !!it.popular,
            isAvailable: true,
            calories: it.cal ?? null,
            prepMin: it.prep ?? null,
            tags: it.tags ?? "",
          },
        });
      }
    }
  }

  // Drivers — first driver linked to the driver auth user
  const driverIds: string[] = [];
  for (let i = 0; i < driversSeed.length; i++) {
    const d = driversSeed[i];
    const drv = await db.driver.create({ data: { ...d, userId: i === 0 ? driverUser.id : null } });
    driverIds.push(drv.id);
  }

  // Promotions
  for (const p of promotions) {
    await db.promotion.create({ data: p });
  }

  // Sample orders — one ACTIVE (en_route) for live tracking demo, plus history
  const firstRest = restaurantIds[0];
  const menuItems = await db.menuItem.findMany({ where: { restaurantId: firstRest } });
  const pick = (name: string) => menuItems.find((m) => m.name === name)!;

  // Active order (en route) — assigned to driver 1
  const activeItems = [
    { menuItemId: pick("Big Doble Bacon").id, name: "Big Doble Bacon", emoji: "🍔", price: 26900, qty: 1, notes: "Sin cebolla" },
    { menuItemId: pick("Papas Andrés").id, name: "Papas Andrés", emoji: "🍟", price: 9900, qty: 1 },
    { menuItemId: pick("Milkshake de Oreo").id, name: "Milkshake de Oreo", emoji: "🥤", price: 11500, qty: 2 },
  ];
  const subtotal = activeItems.reduce((s, i) => s + i.price * i.qty, 0);
  const deliveryFee = 0; // prime
  const serviceFee = Math.round(subtotal * 0.08);
  const total = subtotal + deliveryFee + serviceFee + 2000;
  const activeOrder = await db.order.create({
    data: {
      code: "ANT-7G2K",
      customerId: customer.id,
      restaurantId: firstRest,
      driverId: driverIds[0],
      status: "en_route",
      subtotal,
      deliveryFee,
      serviceFee,
      discount: 0,
      tip: 2000,
      total,
      paymentMethod: "Tarjeta Visa •• 4242",
      address: "Calle 72 #11-25, Chapinero, Apto 402",
      notes: "Tocar timbre 402",
      isGroup: false,
      etaMin: 12,
      driverLat: 4.6548,
      driverLng: -74.0612,
      items: { create: activeItems },
      events: { create: [
        { status: "placed", label: "Pedido confirmado", at: new Date(Date.now() - 1000*60*22) },
        { status: "accepted", label: "El Corral Gourmet aceptó", at: new Date(Date.now() - 1000*60*21) },
        { status: "preparing", label: "Preparando tu pedido", at: new Date(Date.now() - 1000*60*20) },
        { status: "ready", label: "Listo para recoger", at: new Date(Date.now() - 1000*60*9) },
        { status: "picked_up", label: "Andrés recogió el pedido", at: new Date(Date.now() - 1000*60*7) },
        { status: "en_route", label: "En camino a tu dirección", at: new Date(Date.now() - 1000*60*3) },
      ]},
      messages: { create: [
        { sender: "driver", text: "¡Hola Valentina! Ya recogí tu pedido, voy en camino 🏍️", at: new Date(Date.now() - 1000*60*6) },
        { sender: "customer", text: "Perfecto, gracias! Toca el 402", at: new Date(Date.now() - 1000*60*5) },
      ]},
    },
  });

  // History orders (delivered)
  const hist = [
    { rest: restaurantIds[3], items: [{ name: "Dragon Roll", emoji: "🐉", price: 28900, qty: 1 }, { name: "Philadelphia Roll", emoji: "🍣", price: 22900, qty: 1 }], days: 1, rating: 5 },
    { rest: restaurantIds[4], items: [{ name: "Bandeja Paisa", emoji: "🍛", price: 28900, qty: 2 }], days: 3, rating: 5 },
    { rest: restaurantIds[8], items: [{ name: "Latte de la Casa", emoji: "☕", price: 8900, qty: 2 }, { name: "Croissant de Mantequilla", emoji: "🥐", price: 6900, qty: 2 }], days: 5, rating: 4 },
    { rest: restaurantIds[2], items: [{ name: "Combo Familiar", emoji: "🍗", price: 54900, qty: 1 }], days: 8, rating: 5 },
    { rest: restaurantIds[7], items: [{ name: "Volcán de Chocolate", emoji: "🍫", price: 13900, qty: 2 }], days: 11, rating: 5 },
  ];
  for (const h of hist) {
    const sub = h.items.reduce((s, i) => s + i.price * i.qty, 0);
    const df = 3500; const sf = Math.round(sub * 0.08);
    const tot = sub + df + sf;
    const when = new Date(Date.now() - 1000*60*60*24*h.days);
    const o = await db.order.create({
      data: {
        code: "ANT-" + Math.random().toString(36).slice(2, 6).toUpperCase(),
        customerId: customer.id,
        restaurantId: h.rest,
        driverId: driverIds[Math.floor(Math.random()*driverIds.length)],
        status: "delivered",
        subtotal: sub,
        deliveryFee: df,
        serviceFee: sf,
        discount: 0,
        tip: 2000,
        total: tot,
        paymentMethod: "Tarjeta Visa •• 4242",
        address: "Calle 72 #11-25, Chapinero, Apto 402",
        etaMin: 30,
        rating: h.rating,
        createdAt: when,
        items: { create: h.items.map((i) => ({ name: i.name, emoji: i.emoji, price: i.price, qty: i.qty })) },
        events: { create: [
          { status: "placed", label: "Pedido confirmado", at: when },
          { status: "delivered", label: "Entregado", at: new Date(when.getTime() + 1000*60*35) },
        ]},
      },
    });
    await db.review.create({
      data: { orderId: o.id, customerId: customer.id, restaurantId: h.rest, rating: h.rating, comment: h.rating === 5 ? "¡Delicioso y rápido!" : "Bueno, llegó un poco tarde.", foodRating: h.rating, deliveryRating: h.rating, at: new Date(when.getTime()+1000*60*40) },
    });
  }

  // Restaurant-side pending orders (for restaurant dashboard demo): one "placed" + one "preparing"
  const restDemo = restaurantIds[3]; // sushi
  const sushiItems = await db.menuItem.findMany({ where: { restaurantId: restDemo } });
  const s1 = sushiItems.find(m=>m.name==="Dragon Roll")!, s2 = sushiItems.find(m=>m.name==="Philadelphia Roll")!, s3 = sushiItems.find(m=>m.name==="Edamame")!;
  const rsub = s1.price*1 + s2.price*2 + s3.price*1;
  await db.order.create({
    data: {
      code: "ANT-9X4P",
      customerId: customer.id,
      restaurantId: restDemo,
      status: "placed",
      subtotal: rsub, deliveryFee: 4500, serviceFee: Math.round(rsub*0.08), discount: 0, tip: 0,
      total: rsub + 4500 + Math.round(rsub*0.08),
      paymentMethod: "Tarjeta Visa •• 4242",
      address: "Calle 72 #11-25, Chapinero, Apto 402",
      etaMin: 32,
      createdAt: new Date(Date.now() - 1000*60*2),
      items: { create: [
        { menuItemId: s1.id, name: s1.name, emoji: s1.emoji, price: s1.price, qty: 1 },
        { menuItemId: s2.id, name: s2.name, emoji: s2.emoji, price: s2.price, qty: 2 },
        { menuItemId: s3.id, name: s3.name, emoji: s3.emoji, price: s3.price, qty: 1, notes: "Sin sal extra" },
      ]},
      events: { create: [{ status: "placed", label: "Pedido confirmado", at: new Date(Date.now() - 1000*60*2) }] },
    },
  });
  const tacoRest = restaurantIds[9];
  const tItems = await db.menuItem.findMany({ where: { restaurantId: tacoRest } });
  const t1 = tItems.find(m=>m.name==="Al Pastor x3")!, t2 = tItems.find(m=>m.name==="Nachos Supremos")!;
  const tsub = t1.price*2 + t2.price*1;
  await db.order.create({
    data: {
      code: "ANT-5M8Q",
      customerId: customer.id,
      restaurantId: tacoRest,
      status: "preparing",
      subtotal: tsub, deliveryFee: 3900, serviceFee: Math.round(tsub*0.08), discount: 0, tip: 0,
      total: tsub + 3900 + Math.round(tsub*0.08),
      paymentMethod: "Nequi",
      address: "Av. Chile #100-30, Piso 8",
      etaMin: 28,
      createdAt: new Date(Date.now() - 1000*60*6),
      items: { create: [
        { menuItemId: t1.id, name: t1.name, emoji: t1.emoji, price: t1.price, qty: 2 },
        { menuItemId: t2.id, name: t2.name, emoji: t2.emoji, price: t2.price, qty: 1 },
      ]},
      events: { create: [
        { status: "placed", label: "Pedido confirmado", at: new Date(Date.now() - 1000*60*6) },
        { status: "accepted", label: "Taco Loco aceptó", at: new Date(Date.now() - 1000*60*5) },
        { status: "preparing", label: "Preparando tu pedido", at: new Date(Date.now() - 1000*60*3) },
      ]},
    },
  });

  // ---------- Favorites ----------
  await db.favorite.createMany({ data: [
    { customerId: customer.id, restaurantId: restaurantIds[0] },
    { customerId: customer.id, restaurantId: restaurantIds[3] },
    { customerId: customer.id, restaurantId: restaurantIds[4] },
  ]});

  // ---------- Notifications ----------
  await db.notification.createMany({ data: [
    { userId: customerUser.id, title: "¡Tu pedido está en camino!", body: "Andrés va rumbo a tu dirección. ETA 12 min.", type: "order", icon: "🏍️", orderId: activeOrder.id },
    { userId: customerUser.id, title: "Ganaste 200 Antojo Coins", body: "Por completar el reto 'Racha de 3 pedidos'.", type: "reward", icon: "🎁" },
    { userId: customerUser.id, title: "2x1 en El Corral Gourmet", body: "Solo por hoy, 2x1 en hamburguesas clásicas.", type: "promo", icon: "🍔" },
    { userId: customerUser.id, title: "Bienvenida a Antojo Prime", body: "Tu membresía está activa. ¡Envío gratis en todos tus pedidos!", type: "system", icon: "👑", read: true },
    { userId: driverUser.id, title: "Nuevo pago recibido", body: "Ganaste $4.500 por tu última entrega.", type: "reward", icon: "💸" },
    { userId: restaurantUser.id, title: "Nuevo pedido ANT-9X4P", body: "Tienes un nuevo pedido de $61.600 esperando.", type: "order", icon: "🔔" },
    { userId: adminUser.id, title: "3 restaurantes esperan aprobación", body: "Revisa las solicitudes de registro en el panel.", type: "system", icon: "🏪", read: false },
  ]});

  console.log("Seed complete.");
  console.log(`  Customer: ${customer.id}`);
  console.log(`  Restaurants: ${restaurantIds.length}`);
  console.log(`  Drivers: ${driverIds.length}`);
  console.log(`  Active order: ${activeOrder.code} (en_route)`);
  console.log(`  Demo restaurant orders: ANT-9X4P (placed), ANT-5M8Q (preparing)`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await db.$disconnect(); });
