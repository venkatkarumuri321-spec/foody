/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { MenuItem, Order, WaiterRequest, TransactionRecord, RatingRecord } from "./src/types";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON requests
  app.use(express.json());

  // In-memory Database Store
  let menuItems: MenuItem[] = [
    {
      id: "m1",
      name: "Paneer Tikka",
      description: "Tandoor baked cottage cheese chunks marinated in spiked yogurt with bell peppers.",
      price: 240,
      category: "starters",
      image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80",
      isVeg: true,
      isAvailable: true,
      moodTag: "spicy",
      rating: 4.8,
      prepTime: "12 mins",
      chefSpecial: true,
    },
    {
      id: "m2",
      name: "Crispy Samosa Duo",
      description: "Traditional flaky pastry loaded with a savory potato-pea blend and mint chutney.",
      price: 90,
      category: "starters",
      image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=400&q=80",
      isVeg: true,
      isAvailable: true,
      moodTag: "comfort",
      rating: 4.7,
      prepTime: "8 mins",
    },
    {
      id: "m3",
      name: "Spiced Chicken Wings",
      description: "Crispy fried wings tossed in red-hot chili garlic seasoning.",
      price: 280,
      category: "starters",
      image: "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=400&q=80",
      isVeg: false,
      isAvailable: true,
      moodTag: "spicy",
      rating: 4.9,
      prepTime: "10 mins",
      chefSpecial: true,
    },
    {
      id: "m4",
      name: "Butter Chicken",
      description: "Charcoal grill-smoked chicken in a velvet tomato, honey, and cashew cream sauce.",
      price: 360,
      category: "main",
      image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&q=80",
      isVeg: false,
      isAvailable: true,
      moodTag: "happy",
      rating: 4.95,
      prepTime: "18 mins",
      chefSpecial: true,
    },
    {
      id: "m5",
      name: "Dal Makhani",
      description: "Slow-cooked black lentils simmered with heavy butter and aromatic spices.",
      price: 260,
      category: "main",
      image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&q=80",
      isVeg: true,
      isAvailable: true,
      moodTag: "comfort",
      rating: 4.8,
      prepTime: "15 mins",
    },
    {
      id: "m6",
      name: "Garlic Butter Naan",
      description: "Leavened flatbread glazed heavily with fresh minced garlic and creamy butter.",
      price: 60,
      category: "main",
      image: "https://images.unsplash.com/photo-1601356616077-695728ecf769?w=400&q=80",
      isVeg: true,
      isAvailable: true,
      moodTag: "comfort",
      rating: 4.85,
      prepTime: "5 mins",
    },
    {
      id: "m7",
      name: "Fresh Watermelon Mojito",
      description: "Tall glass of muddled fresh red watermelon, sugar syrup, lime, and crushed mint.",
      price: 130,
      category: "drinks",
      image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&q=80",
      isVeg: true,
      isAvailable: true,
      moodTag: "peaceful",
      rating: 4.75,
      prepTime: "4 mins",
    },
    {
      id: "m8",
      name: "Cold Brew Affogato",
      description: "Robust local cold brew topped with a rich scoop of creamy vanilla bean gelato.",
      price: 160,
      category: "drinks",
      image: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400&q=80",
      isVeg: true,
      isAvailable: true,
      moodTag: "happy",
      rating: 4.9,
      prepTime: "6 mins",
    },
    {
      id: "m9",
      name: "Luxury Gulab Jamun",
      description: "Chilled golden fried milk balls soaked in warm saffron-cardamom honey syrup.",
      price: 110,
      category: "desserts",
      image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&q=80",
      isVeg: true,
      isAvailable: true,
      moodTag: "happy",
      rating: 4.9,
      prepTime: "5 mins",
      chefSpecial: true,
    },
    {
      id: "m10",
      name: "Pistachio Mango Kulfi",
      description: "Traditional slow-reduced dense Indian ice cream infused with Alphonso pulp.",
      price: 140,
      category: "desserts",
      image: "https://images.unsplash.com/photo-1505394033641-40c6ad1178d7?w=400&q=80",
      isVeg: true,
      isAvailable: true,
      moodTag: "peaceful",
      rating: 4.85,
      prepTime: "7 mins",
    }
  ];

  let orders: Order[] = [];
  let waiterRequests: WaiterRequest[] = [];
  let transactions: TransactionRecord[] = [];
  let ratings: RatingRecord[] = [];

  // Default menu clone for reset behavior
  const defaultMenu = [...menuItems];

  // API - MENU ENDPOINTS
  app.get("/api/menu", (req, res) => {
    res.json(menuItems);
  });

  app.post("/api/menu", (req, res) => {
    const item: Omit<MenuItem, "id"> = req.body;
    if (!item.name || !item.price || !item.category) {
      return res.status(400).json({ error: "Missing required menu parameters" });
    }
    const newItem: MenuItem = {
      id: "m_" + Date.now(),
      name: item.name,
      description: item.description || "",
      price: Number(item.price),
      category: item.category,
      image: item.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80",
      isVeg: item.isVeg !== undefined ? item.isVeg : true,
      isAvailable: item.isAvailable !== undefined ? item.isAvailable : true,
    };
    menuItems.push(newItem);
    res.status(201).json(newItem);
  });

  app.put("/api/menu/:id", (req, res) => {
    const { id } = req.params;
    const body: Partial<MenuItem> = req.body;
    const index = menuItems.findIndex((item) => item.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "Menu item not found" });
    }
    menuItems[index] = {
      ...menuItems[index],
      ...body,
      price: body.price !== undefined ? Number(body.price) : menuItems[index].price,
    };
    res.json(menuItems[index]);
  });

  app.delete("/api/menu/:id", (req, res) => {
    const { id } = req.params;
    const index = menuItems.findIndex((item) => item.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "Menu item not found" });
    }
    const deleted = menuItems.splice(index, 1);
    res.json(deleted[0]);
  });

  // API - ORDER ENDPOINTS
  app.get("/api/orders", (req, res) => {
    res.json(orders);
  });

  app.post("/api/orders", (req, res) => {
    const payload = req.body;
    if (!payload.tableNumber || !payload.items || payload.items.length === 0) {
      return res.status(400).json({ error: "Invalid order data. Needs a table number and cart items." });
    }
    const newOrder: Order = {
      id: "ord_" + Math.floor(1000 + Math.random() * 9000),
      tableNumber: payload.tableNumber,
      items: payload.items,
      status: "pending",
      totalAmount: Number(payload.totalAmount),
      createdAt: new Date().toISOString(),
      notes: payload.notes || "",
      paymentMethod: payload.paymentMethod || undefined,
      paymentOnlineProvider: payload.paymentOnlineProvider || undefined,
      paymentStatus: payload.paymentStatus || "pending",
    };
    orders.push(newOrder);
    res.status(201).json(newOrder);
  });

  app.put("/api/orders/:id", (req, res) => {
    const { id } = req.params;
    const body: Partial<Order> = req.body;
    const index = orders.findIndex((o) => o.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "Order not found" });
    }
    orders[index] = {
      ...orders[index],
      ...body,
    };
    res.json(orders[index]);
  });

  // API - WAITER ENDPOINTS
  app.get("/api/waiter", (req, res) => {
    res.json(waiterRequests);
  });

  app.post("/api/waiter", (req, res) => {
    const { tableNumber } = req.body;
    if (!tableNumber) {
      return res.status(400).json({ error: "Missing tableNumber" });
    }
    const newRequest: WaiterRequest = {
      id: "wait_" + Date.now(),
      tableNumber,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    waiterRequests.push(newRequest);
    res.status(201).json(newRequest);
  });

  app.put("/api/waiter/:id", (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const index = waiterRequests.findIndex((w) => w.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "Waiter request not found" });
    }
    waiterRequests[index].status = status;
    res.json(waiterRequests[index]);
  });

  // API - TRANSACTIONS
  app.get("/api/transactions", (req, res) => {
    res.json(transactions);
  });

  app.post("/api/transactions", (req, res) => {
    const record: Omit<TransactionRecord, "id" | "timestamp"> = req.body;
    const newRecord: TransactionRecord = {
      id: "tx_" + Math.floor(100000 + Math.random() * 899999),
      ...record,
      timestamp: new Date().toISOString(),
    };
    transactions.push(newRecord);
    res.status(201).json(newRecord);
  });

  // API - RATINGS
  app.get("/api/ratings", (req, res) => {
    res.json(ratings);
  });

  app.post("/api/ratings", (req, res) => {
    const record: Omit<RatingRecord, "id" | "createdAt"> = req.body;
    const newRecord: RatingRecord = {
      id: "rt_" + Date.now(),
      ...record,
      createdAt: new Date().toISOString(),
    };
    ratings.push(newRecord);
    res.status(201).json(newRecord);
  });

  // Reset helper
  app.post("/api/reset", (req, res) => {
    menuItems = [...defaultMenu];
    orders = [];
    waiterRequests = [];
    transactions = [];
    ratings = [];
    res.json({ message: "Database reset to defaults successfully" });
  });

  // Lazy-init Gemini Client
  let aiClient: GoogleGenAI | null = null;
  function getGeminiClient(): GoogleGenAI {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is required. Please set it in the Secrets panel.");
      }
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
    return aiClient;
  }

  // API - AI DISCOVERY ASSISTANT ENDPOINT
  app.post("/api/discovery/chat", async (req, res) => {
    try {
      const { message, history, userLocation } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Missing message query parameter" });
      }

      const client = getGeminiClient();

      // Structure chat contents including history
      const apiHistory = (history || []).map((msg: any) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }]
      }));

      // Current prompt with location context embedded inside text
      const locationContext = userLocation && userLocation.lat && userLocation.lng 
        ? `[User Location context: Latitude ${userLocation.lat}, Longitude ${userLocation.lng}. Town/Area reference: ${userLocation.city || 'Nearby area'}]`
        : `[User Location: Coordinates unknown/blocked. Recommend high rated spots in popular dining clusters or ask client for their general location.]`;

      let currentPromptText = `${locationContext}\n\nUser Query: ${message}`;

      const systemInstruction = `You are an intelligent Restaurant Discovery Assistant integrated into a restaurant recommendation application.

Your primary goal is to help users discover the best restaurants based on their preferences, location, budget, cuisine, ratings, and dining requirements.

Responsibilities:
Recommend restaurants based on:
- User location
- Cuisine preferences
- Budget
- Ratings and reviews
- Distance
- Dining type (family, couple, friends, business meeting, solo dining)

Provide restaurant details:
- Restaurant name
- Cuisine type
- Rating (e.g., 4.5/5, 4.8/5)
- Price range (e.g., $, $$, $$$, or approximate budget in currency symbols)
- Opening hours (e.g., 11 AM - 11 PM)
- Popular dishes
- Contact information
- Address

Display map information:
- Show restaurant location on map by providing estimated coordinates (latitude & longitude) based on the user's physical center location or specified city.
- Provide navigation directions
- Calculate distance from user location
- Suggest nearby restaurants

Answer food-related questions:
- Best dishes
- Vegetarian options
- Vegan options
- Non-vegetarian specialties
- Healthy food choices
- Kids-friendly restaurants

Personalized Recommendations:
- Learn user preferences and suggest trending restaurants nearby.

Recommendation Rules:
1. Prioritize restaurants with high ratings.
2. Consider user's budget and travel distance.
3. Show at least 3-5 restaurant options whenever possible.
4. Explain why each restaurant is recommended.
5. Include estimated travel time (e.g., "12 mins drive", "5 mins walk").
6. Provide a simulated standard Google maps search link in the mapLink field (e.g., https://www.google.com/maps/search/?api=1&query=restaurant+name+address).
7. Coordinates parameter is CRITICAL. Select realistic coordinates that are close to the user's latitude/longitude context (e.g., offset by small random values within +/- 0.05 index if nearby, or relative to the city the user requested) so we can map them nicely. For example, if the location is San Francisco, use lat around 37.77, lng around -122.41.

Special Cases:
1. If the user does not specify a location: Politely ask for their location inside the conversational message.
2. If the user does not specify cuisine: Ask what type of food they prefer.
3. If no restaurants match: Suggest the closest alternatives.
4. If the user asks for "best restaurant near me": Use their current location (passed in the context), sort by ratings, reviews, and distance.

Tone:
- Friendly, Professional, Helpful, Concise, Accurate, Recommendation-focused.

Output Schema Rules:
You MUST respond in JSON format ONLY matching the schema. Do not output anything else than JSON. Always return JSON block matching properties 'message', 'restaurants', 'suggestedFollowups'.`;

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          ...apiHistory,
          { role: "user", parts: [{ text: currentPromptText }] }
        ],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              message: {
                type: Type.STRING,
                description: "Conversational text or response answering the user. Use markdown for styling if needed."
              },
              restaurants: {
                type: Type.ARRAY,
                description: "List of recommended restaurants based on the query, if any.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    rating: { type: Type.STRING, description: "e.g., 4.8" },
                    cuisine: { type: Type.STRING, description: "e.g., North Indian, Italian" },
                    priceRange: { type: Type.STRING, description: "e.g., ₹200-450 or $$" },
                    address: { type: Type.STRING },
                    distance: { type: Type.STRING, description: "e.g., 2.5 km" },
                    openHours: { type: Type.STRING, description: "e.g., 11:00 AM - 11:00 PM" },
                    popularDishes: { type: Type.STRING, description: "e.g., Butter Chicken, Samosas" },
                    mapLink: { type: Type.STRING, description: "e.g., maps.google.com link" },
                    whyRecommended: { type: Type.STRING, description: "Why this fits the user's requirements" },
                    travelTime: { type: Type.STRING, description: "Estimated travel time, e.g., 10 mins" },
                    coordinates: {
                      type: Type.OBJECT,
                      properties: {
                        latitude: { type: Type.NUMBER },
                        longitude: { type: Type.NUMBER }
                      },
                      required: ["latitude", "longitude"]
                    },
                    navigationDirections: { type: Type.STRING, description: "Brief directions from user location" }
                  },
                  required: ["name", "rating", "cuisine", "priceRange", "address", "distance", "openHours", "popularDishes", "whyRecommended", "travelTime", "coordinates", "navigationDirections"]
                }
              },
              suggestedFollowups: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "3-4 direct follow-up suggestions or queries for buttons"
              }
            },
            required: ["message"]
          }
        }
      });

      const responseText = response.text;
      const parsedData = JSON.parse(responseText);
      res.json(parsedData);
    } catch (err: any) {
      console.error("Gemini Discovery AI Error:", err);
      // Failsafe friendly fallback response in case of quota/api key error
      res.status(200).json({
        message: `### 🔮 Welcome to Foody's Dining Hub!\n\nIt looks like our live AI integration is warming up, or your server environment needs its API keys configured. Set your **GEMINI_API_KEY** in the Secrets Tab to enable active web searching and maps grounding!\n\nWe have loaded our pre-loaded curated listing of top nearby dining venues below based on your simulated location!`,
        restaurants: [
          {
            name: "The Viceroy Grand",
            rating: "4.9",
            cuisine: "Royal North Indian, Tandoori",
            priceRange: "₹300 - ₹600",
            address: "18, Royal Heritage Arcade, MG Road, Landmark: Near Metro Station",
            distance: "1.2 km",
            openHours: "12:00 PM - 11:30 PM",
            popularDishes: "Murgh Makhani Velvet, Shahi Paneer, Garlic Naan",
            mapLink: "https://www.google.com/maps/search/?api=1&query=The+Viceroy+Grand+MG+Road",
            whyRecommended: "Highest rated gourmet North Indian diner in the neighborhood. Legendary for its copper-pot slow cooking and signature saffron gravies.",
            travelTime: "6 mins drive",
            coordinates: { latitude: 12.9756, longitude: 77.5975 },
            navigationDirections: "Head North-East on MG Road, take a sharp left at Metro Pillar 45."
          },
          {
            name: "Portofino Bistro",
            rating: "4.8",
            cuisine: "Woodfired Pizza, Authentic Italian",
            priceRange: "₹400 - ₹800",
            address: "42, Residency Layout, Cross Rd, Next to Saffron Tower",
            distance: "2.4 km",
            openHours: "11:30 AM - 11:00 PM",
            popularDishes: "Truffle Mushroom Pizza, Hand-rolled Gnocchi, Classic Tiramisu",
            mapLink: "https://www.google.com/maps/search/?api=1&query=Portofino+Bistro+Residency+Road",
            whyRecommended: "Recognized for double-zero woodfired crust. Ideal for custom gourmet flavor pairings and an atmospheric warm dining setting.",
            travelTime: "10 mins driving",
            coordinates: { latitude: 12.9731, longitude: 77.6045 },
            navigationDirections: "Travel South on Club Road, cross the first junction and check the storefront opposite Saffron Tower."
          },
          {
            name: "Organic Garden Cafe",
            rating: "4.7",
            cuisine: "Healthy Bowls, Vegan Specialities, Specialty Teas",
            priceRange: "₹200 - ₹400",
            address: "5, Green Alley Main, 3rd Block, Jayanagar",
            distance: "3.1 km",
            openHours: "9:00 AM - 9:30 PM",
            popularDishes: "Quinoa Pesto Harvest, Smashed Avocado Toast, Hibiscus Cold Tea",
            mapLink: "https://www.google.com/maps/search/?api=1&query=Organic+Garden+Cafe+Jayanagar",
            whyRecommended: "Excellent choice for complete plant-based meal profiles, nutrient-dense breakfast boards, and single-estate cold brews.",
            travelTime: "12 mins ride",
            coordinates: { latitude: 12.9812, longitude: 77.5898 },
            navigationDirections: "Drive West on 12th Main Road, take a left at the Post Office, cafe will be on your left next to the park."
          }
        ],
        suggestedFollowups: [
          "Show me top spicy foods",
          "What vegan options are there?",
          "Recommend budget friendly starters"
        ]
      });
    }
  });

  // Express Static / Vite setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Serve fallback for Vite routes in production
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Foody Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
