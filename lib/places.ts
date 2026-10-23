// Mumbai places with a simulated "trips per month" count. A real app would count completed trips per place from
// every rider's ride history; here the numbers are made up so the ranking has something to work with.
export type PlaceRow = { id: string; name: string; address: string; latitude: number; longitude: number; visits: number };

const P = (id: string, name: string, address: string, latitude: number, longitude: number, visits: number): PlaceRow => ({ id, name, address, latitude, longitude, visits });

export const POPULAR_PLACES: PlaceRow[] = [
  // Jogeshwari / Andheri / Goregaon
  P("jogeshwari-caves", "Jogeshwari Caves", "Jogeshwari East", 19.1389, 72.8577, 18000),
  P("jogeshwari-stn", "Jogeshwari Railway Station", "Jogeshwari West", 19.136, 72.849, 54000),
  P("mahakali-caves", "Mahakali Caves", "Andheri East", 19.125, 72.873, 14000),
  P("seepz", "SEEPZ", "Andheri East", 19.128, 72.873, 20000),
  P("andheri-stn", "Andheri Railway Station", "Andheri", 19.1197, 72.8464, 98000),
  P("infiniti-andheri", "Infiniti Mall", "Andheri West", 19.1356, 72.8335, 38000),
  P("versova-beach", "Versova Beach", "Versova, Andheri West", 19.131, 72.8115, 27000),
  P("juhu-beach", "Juhu Beach", "Juhu", 19.0988, 72.8265, 52000),
  P("iskcon-juhu", "ISKCON Temple Juhu", "Juhu", 19.1085, 72.825, 17000),
  P("kokilaben", "Kokilaben Hospital", "Andheri West", 19.131, 72.825, 14000),
  P("vile-parle-stn", "Vile Parle Railway Station", "Vile Parle", 19.099, 72.8445, 33000),
  P("santacruz-stn", "Santacruz Railway Station", "Santacruz", 19.0816, 72.8416, 29000),
  P("t1-airport", "Mumbai Airport Terminal 1", "Santacruz East", 19.099, 72.8572, 18000),
  P("goregaon-stn", "Goregaon Railway Station", "Goregaon", 19.1649, 72.8493, 41000),
  P("oberoi-mall", "Oberoi Mall", "Goregaon East", 19.173, 72.861, 36000),
  P("film-city", "Film City", "Goregaon East", 19.1651, 72.8908, 21000),
  P("aarey", "Aarey Milk Colony", "Goregaon East", 19.155, 72.878, 16000),
  P("malad-stn", "Malad Railway Station", "Malad", 19.186, 72.848, 39000),
  P("inorbit-malad", "Inorbit Mall", "Malad West", 19.1744, 72.834, 34000),
  P("kandivali-stn", "Kandivali Railway Station", "Kandivali", 19.2047, 72.8528, 30000),
  P("borivali-stn", "Borivali Railway Station", "Borivali", 19.229, 72.8573, 47000),
  P("kanheri-caves", "Kanheri Caves", "Sanjay Gandhi National Park, Borivali East", 19.2058, 72.9061, 21000),
  P("sgnp", "Sanjay Gandhi National Park", "Borivali East", 19.2147, 72.9106, 26000),
  // Bandra / Kurla / Powai / Ghatkopar
  P("bandra-stn", "Bandra Railway Station", "Bandra", 19.0544, 72.8402, 64000),
  P("bandstand", "Bandstand Promenade", "Bandra West", 19.0431, 72.8227, 44000),
  P("bandra-fort", "Bandra Fort", "Bandra West", 19.0425, 72.8196, 19000),
  P("mount-mary", "Mount Mary Church", "Bandra West", 19.0458, 72.8226, 23000),
  P("linking-road", "Linking Road", "Bandra West", 19.064, 72.835, 35000),
  P("carter-road", "Carter Road Promenade", "Bandra West", 19.068, 72.823, 28000),
  P("jio-world", "Jio World Drive", "BKC, Bandra East", 19.064, 72.865, 33000),
  P("kurla-stn", "Kurla Railway Station", "Kurla", 19.0653, 72.8793, 51000),
  P("phoenix-kurla", "Phoenix Marketcity", "Kurla West", 19.0865, 72.889, 40000),
  P("ghatkopar-stn", "Ghatkopar Railway Station", "Ghatkopar", 19.0866, 72.9081, 46000),
  P("hiranandani", "Hiranandani Gardens", "Powai", 19.1176, 72.906, 24000),
  // Dadar / South Mumbai
  P("dadar-stn", "Dadar Railway Station", "Dadar", 19.0186, 72.8428, 72000),
  P("shivaji-park", "Shivaji Park", "Dadar West", 19.027, 72.837, 25000),
  P("siddhivinayak", "Siddhivinayak Temple", "Prabhadevi", 19.0169, 72.8305, 49000),
  P("worli-sea-face", "Worli Sea Face", "Worli", 19.012, 72.815, 27000),
  P("palladium", "Phoenix Palladium", "Lower Parel", 18.9937, 72.8258, 31000),
  P("haji-ali", "Haji Ali Dargah", "Haji Ali", 18.9827, 72.8089, 42000),
  P("marine-drive", "Marine Drive", "Nariman Point", 18.944, 72.823, 58000),
  P("churchgate", "Churchgate Railway Station", "Churchgate", 18.9322, 72.8264, 55000),
  P("gateway", "Gateway of India", "Colaba", 18.922, 72.8347, 63000),
  P("csmt", "Chhatrapati Shivaji Terminus (CSMT)", "Fort", 18.9398, 72.8355, 77000),
  P("colaba-causeway", "Colaba Causeway", "Colaba", 18.9217, 72.8332, 37000),
];
