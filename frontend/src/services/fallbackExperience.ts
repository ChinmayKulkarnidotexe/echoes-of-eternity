/**
 * Offline copy of GET /experience/1 — generated, do not edit by hand.
 *
 * The monument experience falls back to this when FastAPI is unreachable, which
 * is the risk mitigation the PRD asks for in section 12 and also lets the
 * frontend be demoed on its own. Regenerate after editing app/tour_data.py:
 *
 *     cd backend && .venv/Scripts/python.exe -m scripts.export_fallback
 *
 * It is typed as ExperienceBundle, so drift between this copy and the backend's
 * payload shape surfaces as a build error rather than a runtime surprise.
 */

import type { ExperienceBundle } from '../types';

export const FALLBACK_EXPERIENCE: ExperienceBundle = {
    "version": 4,
    "monument": {
      "id": 1,
      "name": "Statue of Liberty",
      "location": "Liberty Island, New York Harbour",
      "era": "1875 – 1886",
      "description": "A colossal neoclassical sculpture on Liberty Island in New York Harbour. Designed by French sculptor Frederic Auguste Bartholdi with an internal iron framework by Gustave Eiffel, it was dedicated on 28 October 1886 as a gift from the people of France to the United States. Its formal name is 'Liberty Enlightening the World'.",
      "center": {
        "lat": 40.68925,
        "lng": -74.0445
      }
    },
    "aerial": {
      "center": {
        "lat": 40.68925,
        "lng": -74.0445,
        "height_m": 28.0
      },
      "orbit": {
        "radius_m": 190.0,
        "pitch_deg": -28.0,
        "start_heading_deg": 170.0,
        "revolution_seconds": 58.0,
        "direction": 1
      },
      "beats": [
        {
          "id": "aerial-1",
          "index": 0,
          "title": "Liberty Island, New York Harbour",
          "narration": "You are looking down on Liberty Island, in the mouth of the Hudson. Below you stands Liberty Enlightening the World, ninety-three metres from the base of her pedestal to the tip of her torch, facing out to sea along the channel every arriving ship once sailed.",
          "facts": "Full formal name: Liberty Enlightening the World (La Liberte eclairant le monde). Total height from pedestal base to torch tip is 305 ft / 93 m. The island was called Bedloe's Island until 1956. The statue faces south-east, toward the Narrows."
        },
        {
          "id": "aerial-2",
          "index": 1,
          "title": "The Eleven-Pointed Star",
          "narration": "Notice the shape she is standing on. Those eleven points are the walls of Fort Wood, a harbour battery finished in 1811. Rather than level it, the builders set the pedestal inside the old fort, so a defensive work became the foundation of a monument to welcome.",
          "facts": "Fort Wood was an eleven-pointed star-shaped masonry fortification completed in 1811 and named for Eleazer Derby Wood. Richard Morris Hunt's 89 ft granite pedestal was built inside its walls between 1884 and 1886."
        },
        {
          "id": "aerial-3",
          "index": 2,
          "title": "A Gift, Shipped in Pieces",
          "narration": "She arrived here in crates. Three hundred and fifty pieces, packed into two hundred and fourteen crates, carried across the Atlantic by the French frigate Isere in 1885, then riveted back together on this spot. Let us go down to the walkway and take a closer look.",
          "facts": "The statue was disassembled into 350 pieces, packed in 214 crates, and shipped aboard the French frigate Isere, arriving in New York on 17 June 1885. Reassembly took four months; dedication was 28 October 1886 by President Grover Cleveland."
        }
      ]
    },
    "tour": {
      "waypoints": [
        {
          "id": "wp-01",
          "index": 0,
          "pano_id": "FrMSfGjQMFBoLLsN65ythg",
          "lat": 40.6886263,
          "lng": -74.0445868,
          "heading": 6.0,
          "pitch": 20.0,
          "zoom": 0.6,
          "dwell_s": 17,
          "title": "The Front Approach",
          "subtitle": "South walkway",
          "distance_to_statue_m": 69.3,
          "narration": "This is the view she was designed for, straight on, from the water. A gift from the people of France, dedicated in October 1886 to mark a century of American independence. Everything about her is meant to be read from a ship's deck.",
          "facts": "Conceived by Edouard de Laboulaye and sculpted by Frederic Auguste Bartholdi as a gift from France to the United States, dedicated 28 October 1886. Bartholdi designed the silhouette to be legible at a distance from arriving vessels."
        },
        {
          "id": "wp-02",
          "index": 1,
          "pano_id": "X6ftr9rvtRVa_z1NL9-_2g",
          "lat": 40.6888801,
          "lng": -74.044952,
          "heading": 42.8,
          "pitch": 10.0,
          "zoom": 1.0,
          "dwell_s": 17,
          "title": "The Pedestal & Fort Wood",
          "subtitle": "South-west walkway",
          "distance_to_statue_m": 55.9,
          "narration": "France sent the statue; America had to pay for the pedestal, and nearly failed. Joseph Pulitzer saved it by printing the name of every donor in his newspaper. A hundred and twenty thousand people gave, most of them less than a dollar.",
          "facts": "Richard Morris Hunt's granite-and-concrete pedestal is 89 ft (27 m) tall and sits inside the walls of Fort Wood. Joseph Pulitzer's 1885 campaign in The World raised $102,000 from over 120,000 donors, most contributing under one dollar."
        },
        {
          "id": "wp-03",
          "index": 2,
          "pano_id": "Im3JOqgjKP7SX9A9hmfrGg",
          "lat": 40.6890498,
          "lng": -74.0452833,
          "heading": 71.4,
          "pitch": 34.0,
          "zoom": 1.6,
          "dwell_s": 16,
          "title": "The Tablet",
          "subtitle": "West walkway",
          "distance_to_statue_m": 69.7,
          "narration": "In her left arm she carries a tabula ansata, a tablet of law. Look closely and the inscription is a date in Roman numerals: JULY IV MDCCLXXVI. The fourth of July, 1776. She is holding the Declaration of Independence.",
          "facts": "The tabula ansata is 23 ft 7 in long, 13 ft 7 in wide and 2 ft thick, inscribed JULY IV MDCCLXXVI, the date of the American Declaration of Independence. The handled-tablet form evokes tablets of law in classical art."
        },
        {
          "id": "wp-04",
          "index": 3,
          "pano_id": "yu1xC87CQAazYHM1cl7LQg",
          "lat": 40.6894864,
          "lng": -74.0453211,
          "heading": 110.8,
          "pitch": 46.0,
          "zoom": 2.2,
          "dwell_s": 17,
          "title": "The Torch & Flame",
          "subtitle": "West-north-west walkway",
          "distance_to_statue_m": 74.1,
          "narration": "The flame above you is not the original. Bartholdi's torch leaked for a century, so in 1986 it was replaced with a copper flame sheathed in twenty-four-carat gold leaf, lit from below so it reflects rather than glows. The 1886 original now sits in the museum.",
          "facts": "The current flame, installed during the 1984-1986 centennial restoration, is copper covered in 24-karat gold leaf and illuminated by external floodlights reflecting off the gold. The original 1886 torch is displayed in the Statue of Liberty Museum. The torch tip reaches 305 ft (93 m) above ground."
        },
        {
          "id": "wp-05",
          "index": 4,
          "pano_id": "6vKZIF2naSt_v1la_jAnDw",
          "lat": 40.6899246,
          "lng": -74.0450031,
          "heading": 24.0,
          "pitch": 2.0,
          "zoom": 0.8,
          "dwell_s": 15,
          "title": "What She Watches",
          "subtitle": "North walkway, looking to Manhattan",
          "distance_to_statue_m": 85.8,
          "narration": "Turn away from her for a moment. This harbour is the reason she stands here. For sixty-two years, the first thing twelve million immigrants saw of America was this skyline, and her, off the starboard rail, on the way to Ellis Island.",
          "facts": "Ellis Island, roughly 800 m north of Liberty Island, processed about 12 million immigrants between 1892 and 1954. Emma Lazarus's 1883 sonnet The New Colossus, with the line 'Give me your tired, your poor', was written to raise pedestal funds and was mounted inside the pedestal in 1903."
        },
        {
          "id": "wp-06",
          "index": 5,
          "pano_id": "njZFcoMaph5hR5bNAN06BQ",
          "lat": 40.6898495,
          "lng": -74.044258,
          "heading": 197.0,
          "pitch": 42.0,
          "zoom": 2.0,
          "dwell_s": 16,
          "title": "The Crown & Seven Rays",
          "subtitle": "North-east walkway",
          "distance_to_statue_m": 69.3,
          "narration": "Count the spikes on her crown. There are seven, one for each continent and each sea, light reaching everywhere. Just below them, twenty-five windows. Visitors who climb the three hundred and fifty-four steps look out through those.",
          "facts": "The crown bears 7 rays, representing the seven continents and seven seas, and 25 windows said to represent gemstones of the earth. 354 steps lead from the pedestal to the crown; crown access is limited to a small number of ticketed visitors per day."
        },
        {
          "id": "wp-07",
          "index": 6,
          "pano_id": "PA9f9HgpMuB43u0jg5bysA",
          "lat": 40.6897856,
          "lng": -74.0438603,
          "heading": 222.2,
          "pitch": 32.0,
          "zoom": 2.4,
          "dwell_s": 17,
          "title": "The Copper Skin",
          "subtitle": "East-north-east walkway",
          "distance_to_statue_m": 80.1,
          "narration": "Her skin is thinner than you would believe, about three hundred copper sheets, each two point four millimetres thick. Two pennies, stacked. She arrived a bright reddish brown, and took roughly twenty years of sea air to oxidise into this green.",
          "facts": "The exterior is approximately 300 hand-hammered copper saddles each about 3/32 in (2.4 mm) thick, roughly 31 tons of copper in total, shaped by the repousse technique. The verdigris patina formed over about two decades and now protects the copper beneath."
        },
        {
          "id": "wp-08",
          "index": 7,
          "pano_id": "CB8-ERqvWg0GEYm4_IPSNg",
          "lat": 40.6895078,
          "lng": -74.0437884,
          "heading": 244.5,
          "pitch": 26.0,
          "zoom": 1.8,
          "dwell_s": 17,
          "title": "Eiffel's Hidden Skeleton",
          "subtitle": "East walkway",
          "distance_to_statue_m": 66.5,
          "narration": "That thin copper hangs on an iron skeleton designed by Gustave Eiffel, three years before his tower. A central pylon with a flexible spring armature, so she is built to move. In a stiff harbour wind the torch can sway several inches.",
          "facts": "Gustave Eiffel designed the internal iron framework: a 92 ft central pylon with a secondary flexible armature, allowing the copper skin to expand, contract and flex independently. In 50 mph winds the statue sways up to 3 in and the torch up to 5 in. The design anticipates modern curtain-wall construction."
        },
        {
          "id": "wp-09",
          "index": 8,
          "pano_id": "avHS2Qtdd10GFAyb77aJTg",
          "lat": 40.6892805,
          "lng": -74.0437743,
          "heading": 266.8,
          "pitch": 16.0,
          "zoom": 1.2,
          "dwell_s": 16,
          "title": "The Robe & The Stride",
          "subtitle": "East walkway",
          "distance_to_statue_m": 61.3,
          "narration": "She is not standing still. Look at the hem of her robe. The right foot is lifted, heel off the ground, caught mid-step. Bartholdi sculpted a figure walking forward, out of the broken chains at her heel.",
          "facts": "Bartholdi modelled Libertas, the Roman goddess of liberty, in a flowing stola with the right foot raised mid-stride. The face is widely held to be modelled on the sculptor's mother, Charlotte Beysser Bartholdi. The statue alone, feet to torch, is 151 ft 1 in."
        },
        {
          "id": "wp-10",
          "index": 9,
          "pano_id": "yRV-onFD-aGpdNd99iLsFQ",
          "lat": 40.6890631,
          "lng": -74.0438207,
          "heading": 289.9,
          "pitch": 6.0,
          "zoom": 1.8,
          "dwell_s": 16,
          "title": "The Broken Chains",
          "subtitle": "East-south-east walkway",
          "distance_to_statue_m": 60.9,
          "narration": "This is the part almost nobody sees. At her feet lie a shattered shackle and a broken chain. Laboulaye conceived her in the year the Civil War ended and slavery was abolished, and Bartholdi put the chains down there, where only the sky could see them.",
          "facts": "A broken shackle and chain lie at the statue's feet, largely hidden from ground level and clearly visible only from the air. De Laboulaye proposed the statue in 1865, the year the Thirteenth Amendment abolished slavery and the Civil War ended. Bartholdi had earlier sketched a broken chain held in Liberty's hand before relocating it to her feet."
        },
        {
          "id": "wp-11",
          "index": 10,
          "pano_id": "GTYuuTatrAQO2GkVuYOD_w",
          "lat": 40.6888274,
          "lng": -74.0438894,
          "heading": 312.4,
          "pitch": 18.0,
          "zoom": 0.7,
          "dwell_s": 16,
          "title": "Lighthouse, Then Landmark",
          "subtitle": "South-east walkway, full circuit",
          "distance_to_statue_m": 69.6,
          "narration": "One last thing before I hand her over to you. For her first sixteen years she was a working lighthouse, run by the Lighthouse Board, a monument on the payroll. Today she is a World Heritage Site, and about four million people a year come to stand where you are.",
          "facts": "From 1886 to 1902 the statue was operated as a lighthouse under the United States Lighthouse Board, though the torch was too dim to be useful for navigation. It became a National Monument in 1924 and a UNESCO World Heritage Site in 1984, and receives roughly 4 million visitors per year."
        }
      ],
      "estimated_seconds": 180
    },
    "free_roam": {
      "start_pano_id": "FrMSfGjQMFBoLLsN65ythg",
      "start_heading": 6.0,
      "start_pitch": 20.0,
      "pois": [
        {
          "id": "poi-torch",
          "name": "The Torch",
          "label": "Torch",
          "icon": "flame",
          "lat": 40.6891877,
          "lng": -74.0446165,
          "height_m": 90.0,
          "category": "Detail",
          "summary": "A copper flame in 24-carat gold leaf, replaced in 1986.",
          "facts": "The 1986 replacement flame is copper sheathed in 24-karat gold leaf, lit by external floodlights reflecting off the gold rather than from within. Bartholdi's original 1886 torch, cut about with glass windows that leaked for a century, is now displayed in the Statue of Liberty Museum. The torch tip is 305 ft (93 m) above ground level."
        },
        {
          "id": "poi-crown",
          "name": "The Crown",
          "label": "Crown",
          "icon": "crown",
          "lat": 40.68925,
          "lng": -74.0445,
          "height_m": 80.0,
          "category": "Detail",
          "summary": "Seven rays, twenty-five windows, 354 steps up.",
          "facts": "The diadem carries 7 rays for the seven continents and seas, and 25 windows. 354 steps spiral up from the pedestal to the crown platform, which holds only a handful of visitors at a time; crown tickets are capped daily and sell out months ahead."
        },
        {
          "id": "poi-tablet",
          "name": "The Tablet",
          "label": "Tablet",
          "icon": "tablet",
          "lat": 40.6892811,
          "lng": -74.0444418,
          "height_m": 62.0,
          "category": "Symbolism",
          "summary": "A tablet of law inscribed JULY IV MDCCLXXVI.",
          "facts": "The tabula ansata measures 23 ft 7 in by 13 ft 7 in and is inscribed JULY IV MDCCLXXVI, 4 July 1776. The handled-tablet form is a classical device signalling law and covenant, and Bartholdi chose it over a scroll so the date would read clearly from a distance."
        },
        {
          "id": "poi-chains",
          "name": "The Broken Chains",
          "label": "Broken Chains",
          "icon": "chains",
          "lat": 40.6892204,
          "lng": -74.0444728,
          "height_m": 47.0,
          "category": "Symbolism",
          "summary": "A shattered shackle at her feet, hidden from the ground.",
          "facts": "A broken shackle and chain lie beneath the hem of the robe, visible in full only from the air. Edouard de Laboulaye proposed the monument in 1865, the year the Civil War ended and the Thirteenth Amendment abolished slavery. Bartholdi first sketched Liberty holding a broken chain, then moved it to her feet so the torch would carry the composition."
        },
        {
          "id": "poi-pedestal",
          "name": "The Pedestal & Fort Wood",
          "label": "Pedestal",
          "icon": "pedestal",
          "lat": 40.68925,
          "lng": -74.0445,
          "height_m": 22.0,
          "category": "Architecture",
          "summary": "89 ft of granite, inside an 1811 star fort.",
          "facts": "Richard Morris Hunt's pedestal rises 89 ft (27 m) and sits within the eleven-pointed walls of Fort Wood, completed in 1811. Funding stalled until Joseph Pulitzer ran a campaign in The World, printing every donor's name; over 120,000 people gave $102,000, most of them less than a dollar each."
        }
      ],
      "panos": [
        {
          "pano_id": "FrMSfGjQMFBoLLsN65ythg",
          "lat": 40.6886263,
          "lng": -74.0445868,
          "label": "The Front Approach",
          "heading_to_statue": 6.0
        },
        {
          "pano_id": "X6ftr9rvtRVa_z1NL9-_2g",
          "lat": 40.6888801,
          "lng": -74.044952,
          "label": "The Pedestal & Fort Wood",
          "heading_to_statue": 42.8
        },
        {
          "pano_id": "Im3JOqgjKP7SX9A9hmfrGg",
          "lat": 40.6890498,
          "lng": -74.0452833,
          "label": "The Tablet",
          "heading_to_statue": 71.4
        },
        {
          "pano_id": "yu1xC87CQAazYHM1cl7LQg",
          "lat": 40.6894864,
          "lng": -74.0453211,
          "label": "The Torch & Flame",
          "heading_to_statue": 110.8
        },
        {
          "pano_id": "6vKZIF2naSt_v1la_jAnDw",
          "lat": 40.6899246,
          "lng": -74.0450031,
          "label": "What She Watches",
          "heading_to_statue": 24.0
        },
        {
          "pano_id": "njZFcoMaph5hR5bNAN06BQ",
          "lat": 40.6898495,
          "lng": -74.044258,
          "label": "The Crown & Seven Rays",
          "heading_to_statue": 197.0
        },
        {
          "pano_id": "PA9f9HgpMuB43u0jg5bysA",
          "lat": 40.6897856,
          "lng": -74.0438603,
          "label": "The Copper Skin",
          "heading_to_statue": 222.2
        },
        {
          "pano_id": "CB8-ERqvWg0GEYm4_IPSNg",
          "lat": 40.6895078,
          "lng": -74.0437884,
          "label": "Eiffel's Hidden Skeleton",
          "heading_to_statue": 244.5
        },
        {
          "pano_id": "avHS2Qtdd10GFAyb77aJTg",
          "lat": 40.6892805,
          "lng": -74.0437743,
          "label": "The Robe & The Stride",
          "heading_to_statue": 266.8
        },
        {
          "pano_id": "yRV-onFD-aGpdNd99iLsFQ",
          "lat": 40.6890631,
          "lng": -74.0438207,
          "label": "The Broken Chains",
          "heading_to_statue": 289.9
        },
        {
          "pano_id": "GTYuuTatrAQO2GkVuYOD_w",
          "lat": 40.6888274,
          "lng": -74.0438894,
          "label": "Lighthouse, Then Landmark",
          "heading_to_statue": 312.4
        }
      ]
    },
    "narration_source": "authored",
    "live_answers": true
  };
