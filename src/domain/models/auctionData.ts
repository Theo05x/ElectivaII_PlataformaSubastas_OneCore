export const categorias = [
  { "id": "cat_1", "name": "Videojuegos" },
  { "id": "cat_2", "name": "Arte" },
  { "id": "cat_3", "name": "Tecnología" },
  { "id": "cat_4", "name": "Música" },
  { "id": "cat_5", "name": "Deportes" },
  { "id": "cat_6", "name": "Literatura" },
  { "id": "cat_7", "name": "Cine y Series" },
  { "id": "cat_8", "name": "Ciencia" },
  { "id": "cat_9", "name": "Fotografía" },
  { "id": "cat_10", "name": "Gastronomía" }
];

export const subastas = [
  {
    "id": "auc_1",
    "sellerId": "usr_1",
    "basePrice": 100000,
    "minimumIncrement": 10000,
    "endDate": "2026-09-10T18:00:00Z",
    "status": "OPEN",
    "article": {
      "title": "Consola Retro",
      "description": "Consola clásica de 8 bits en caja original",
      "categoryId": "cat_1"
    }
  },
  {
    "id": "auc_2",
    "sellerId": "usr_2",
    "basePrice": 250000,
    "minimumIncrement": 15000,
    "endDate": "2026-09-12T20:30:00Z",
    "status": "OPEN",
    "article": {
      "title": "Óleo sobre Lienzo Abstracto",
      "description": "Pintura moderna en tonos azules y dorados, firmada por el autor",
      "categoryId": "cat_2"
    }
  },
  {
    "id": "auc_3",
    "sellerId": "usr_3",
    "basePrice": 850000,
    "minimumIncrement": 50000,
    "endDate": "2026-09-15T15:00:00Z",
    "status": "OPEN",
    "article": {
      "title": "Tarjeta Gráfica RTX 3060",
      "description": "Usada únicamente para desarrollo y diseño, excelente estado",
      "categoryId": "cat_3"
    }
  },
  {
    "id": "auc_4",
    "sellerId": "usr_4",
    "basePrice": 150000,
    "minimumIncrement": 10000,
    "endDate": "2026-09-11T12:00:00Z",
    "status": "OPEN",
    "article": {
      "title": "Tocadiscos Vintage con Bluetooth",
      "description": "Reproductor de vinilos de 3 velocidades con acabado en madera",
      "categoryId": "cat_4"
    }
  },
  {
    "id": "auc_5",
    "sellerId": "usr_5",
    "basePrice": 60000,
    "minimumIncrement": 5000,
    "endDate": "2026-09-09T22:00:00Z",
    "status": "OPEN",
    "article": {
      "title": "Balón Oficial de Fútbol Profesional",
      "description": "Nuevo, sellado en su empaque original",
      "categoryId": "cat_5"
    }
  },
  {
    "id": "auc_6",
    "sellerId": "usr_6",
    "basePrice": 45000,
    "minimumIncrement": 5000,
    "endDate": "2026-09-14T19:00:00Z",
    "status": "OPEN",
    "article": {
      "title": "Edición Especial Cien Años de Soledad",
      "description": "Libro de pasta dura conmemorativo ilustrado",
      "categoryId": "cat_6"
    }
  },
  {
    "id": "auc_7",
    "sellerId": "usr_7",
    "basePrice": 1200000,
    "minimumIncrement": 50000,
    "endDate": "2026-09-18T21:00:00Z",
    "status": "OPEN",
    "article": {
      "title": "Proyector LED Portátil 1080p",
      "description": "Ideal para cine en casa, incluye trípode y control remoto",
      "categoryId": "cat_7"
    }
  },
  {
    "id": "auc_8",
    "sellerId": "usr_8",
    "basePrice": 300000,
    "minimumIncrement": 20000,
    "endDate": "2026-09-13T16:00:00Z",
    "status": "OPEN",
    "article": {
      "title": "Microscopio Digital USB",
      "description": "Aumento de hasta 1000x para electrónica y ciencia de materiales",
      "categoryId": "cat_8"
    }
  },
  {
    "id": "auc_9",
    "sellerId": "usr_9",
    "basePrice": 450000,
    "minimumIncrement": 25000,
    "endDate": "2026-09-16T17:30:00Z",
    "status": "OPEN",
    "article": {
      "title": "Cámara Réflex Análoga Antigüedad",
      "description": "Cámara de 35mm con lente de 50mm funcional y estuche de cuero",
      "categoryId": "cat_9"
    }
  },
  {
    "id": "auc_10",
    "sellerId": "usr_10",
    "basePrice": 180000,
    "minimumIncrement": 10000,
    "endDate": "2026-09-11T14:00:00Z",
    "status": "OPEN",
    "article": {
      "title": "Set de Cuchillos de Chef Profesional",
      "description": "Acero inoxidable con bloque de madera incluido, nuevos",
      "categoryId": "cat_10"
    }
  }
];

export const pujas = 
 [
  { "id": "bid_1", "auctionId": "auc_1", "amount": 110000, "bidderId": "usr_2", "createdAt": "2026-09-01T12:00:00Z" },
  { "id": "bid_2", "auctionId": "auc_2", "amount": 265000, "bidderId": "usr_3", "createdAt": "2026-09-01T13:15:00Z" },
  { "id": "bid_3", "auctionId": "auc_3", "amount": 900000, "bidderId": "usr_4", "createdAt": "2026-09-01T14:30:00Z" },
  { "id": "bid_4", "auctionId": "auc_4", "amount": 160000, "bidderId": "usr_5", "createdAt": "2026-09-01T15:00:00Z" },
  { "id": "bid_5", "auctionId": "auc_5", "amount": 65000, "bidderId": "usr_6", "createdAt": "2026-09-01T16:20:00Z" },
  { "id": "bid_6", "auctionId": "auc_6", "amount": 50000, "bidderId": "usr_7", "createdAt": "2026-09-01T17:00:00Z" },
  { "id": "bid_7", "auctionId": "auc_7", "amount": 1250000, "bidderId": "usr_8", "createdAt": "2026-09-01T17:45:00Z" },
  { "id": "bid_8", "auctionId": "auc_8", "amount": 320000, "bidderId": "usr_9", "createdAt": "2026-09-01T18:10:00Z" },
  { "id": "bid_9", "auctionId": "auc_9", "amount": 475000, "bidderId": "usr_10", "createdAt": "2026-09-01T19:00:00Z" },
  { "id": "bid_10", "auctionId": "auc_10", "amount": 190000, "bidderId": "usr_1", "createdAt": "2026-09-01T20:30:00Z" }
];

export const pujasRechazadas = 
    [
  { "id": "rej_1", "auctionId": "auc_1", "amount": 105000, "bidderId": "usr_3", "reason": "Monto inferior al incremento mínimo requerido", "createdAt": "2026-09-01T12:05:00Z" },
  { "id": "rej_2", "auctionId": "auc_2", "amount": 255000, "bidderId": "usr_4", "reason": "Monto inferior al incremento mínimo requerido", "createdAt": "2026-09-01T13:30:00Z" },
  { "id": "rej_3", "auctionId": "auc_3", "amount": 870000, "bidderId": "usr_5", "reason": "La puja es menor a la oferta actual más el incremento mínimo", "createdAt": "2026-09-01T14:45:00Z" },
  { "id": "rej_4", "auctionId": "auc_4", "amount": 155000, "bidderId": "usr_6", "reason": "Monto inferior al incremento mínimo requerido", "createdAt": "2026-09-01T15:15:00Z" },
  { "id": "rej_5", "auctionId": "auc_5", "amount": 62000, "bidderId": "usr_7", "reason": "Monto inferior al incremento mínimo requerido", "createdAt": "2026-09-01T16:35:00Z" },
  { "id": "rej_6", "auctionId": "auc_6", "amount": 47000, "bidderId": "usr_8", "reason": "Monto inferior al incremento mínimo requerido", "createdAt": "2026-09-01T17:15:00Z" },
  { "id": "rej_7", "auctionId": "auc_7", "amount": 1220000, "bidderId": "usr_9", "reason": "La puja es menor a la oferta actual más el incremento mínimo", "createdAt": "2026-09-01T18:00:00Z" },
  { "id": "rej_8", "auctionId": "auc_8", "amount": 310000, "bidderId": "usr_10", "reason": "Monto inferior al incremento mínimo requerido", "createdAt": "2026-09-01T18:25:00Z" },
  { "id": "rej_9", "auctionId": "auc_9", "amount": 460000, "bidderId": "usr_1", "reason": "Monto inferior al incremento mínimo requerido", "createdAt": "2026-09-01T19:15:00Z" },
  { "id": "rej_10", "auctionId": "auc_10", "amount": 185000, "bidderId": "usr_2", "reason": "Monto inferior al incremento mínimo requerido", "createdAt": "2026-09-01T20:45:00Z" }
];