const Test = require("../models/testModel");
const Question = require("../models/questionModel");
const User = require("../models/userModel");
const SeedFlag = require("../models/seedFlagModel");
const { TEST_FORMATS } = require("./testFormats");

// Two graded Classification ("odd one out") mock tests — a 40-question Challenge
// Mode and a 50-question Survivor Mode — sourced from examveda, which the founder
// has permission to use. Reproduced faithfully (two obvious source glitches fixed:
// a duplicated option and a "Pallete" → "Palette" typo). Graded ("test") with no
// close window → lifetime access + a live leaderboard the moment you finish.

const STEM = "Choose the word which is different from the rest.";
const q = (options, correctIndex, explanation) => ({ text: STEM, options, correctIndex, explanation });

const CLASSIFICATION_CHALLENGE = [
    q(["Chicken", "Snake", "Swan", "Crocodile", "Frog"], 0, "All except Chicken can live in water."),
    q(["Cap", "Turban", "Helmet", "Veil", "Hat"], 3, "All except Veil cover the head, while the veil covers the face."),
    q(["Kiwi", "Eagle", "Emu", "Ostrich", "Penguin"], 1, "All except Eagle are flightless birds."),
    q(["Rigveda", "Yajurveda", "Atharvaveda", "Ayurveda", "Samveda"], 3, "All except Ayurveda are the four Vedas (holy scriptures); Ayurveda is a branch of medicine."),
    q(["Curd", "Butter", "Oil", "Cheese", "Cream"], 2, "All except Oil are products obtained from milk."),
    q(["Potassium", "Silicon", "Zirconium", "Gallium", "Germanium"], 0, "All except Potassium are used in semiconductor devices."),
    q(["Tea", "Cinchona", "Rubber", "Cardamom", "Chalk"], 4, "All except Chalk are obtained from crops."),
    q(["Hangar", "Platform", "Dock", "Park", "Bus stand"], 3, "All except Park are halting places of various means of transport."),
    q(["Sparrow", "Swan", "Parrot", "Koel"], 1, "Swan is the only water bird in the group."),
    q(["Tall", "Huge", "Thin", "Sharp", "Small"], 3, "All except Sharp are related to dimension."),
    q(["Pear", "Apple", "Litchi", "Guava", "Orange"], 4, "Orange is the only citrus fruit in the group."),
    q(["Dagger", "Hammer", "Knife", "Sword", "Blade"], 1, "All except Hammer are sharp-edged and have a cutting action."),
    q(["Kanpur", "Allahabad", "Varanasi", "Mathura", "Ghazipur"], 3, "All except Mathura are cities on the banks of the Ganga."),
    q(["Oyster", "Clam", "Scallop", "Mussel", "Mast"], 4, "All except Mast are shellfish; a mast is a pole that supports sails."),
    q(["Deck", "Quay", "Stern", "Bow", "Mast"], 1, "All except Quay are parts of a ship."),
    q(["Producer", "Director", "Investor", "Financier", "Entrepreneur"], 1, "All except Director spend money."),
    q(["Tricycle", "Trident", "Trifle", "Tricolour", "Trilogy"], 2, "In all except Trifle, 'tri' indicates 'three'."),
    q(["Chameleon", "Crocodile", "Alligator", "Locust", "Salamander"], 3, "All except Locust are reptiles; a locust is an insect."),
    q(["Calendar", "Year", "Date", "Month", "Day"], 0, "All the others are parts of a calendar."),
    q(["Mumbai", "Cochin", "Kandla", "Mysore", "Vishakhapatnam"], 3, "All except Mysore are harbours."),
    q(["Cumin", "Groundnut", "Cinnamon", "Pepper", "Clove"], 1, "All except Groundnut are spices."),
    q(["Biscuits", "Chocolate", "Cake", "Bread", "Pastry"], 1, "All except Chocolate are baked items."),
    q(["Sweep", "Wipe", "Scrub", "Wash", "Stain"], 4, "All except Stain are terms related to cleaning."),
    q(["Coat", "Shirt", "Blouse", "Trousers", "Sweater"], 3, "All except Trousers cover the upper part of the body."),
    q(["Asia", "Argentina", "Africa", "Australia", "Antarctica"], 1, "All except Argentina are continents; Argentina is a country."),
    q(["Japan", "India", "Sri Lanka", "New Zealand", "Korea"], 1, "All except India are islands; India is a peninsula."),
    q(["Spectacles", "Goggles", "Binoculars", "Microphone", "Telescope"], 3, "All except Microphone are related to the eyes."),
    q(["Shehnai", "Bagpipe", "Flute", "Sitar", "Harmonica"], 3, "All except Sitar are wind instruments; the sitar is a string instrument."),
    q(["Cheetah", "Lion", "Bear", "Tiger", "Leopard"], 2, "All except Bear belong to the cat family."),
    q(["Sheep", "Gazelle", "Ibex", "Shrew", "Tapir"], 1, "All except Gazelle are animals found in the mountains."),
    q(["Flood", "Hurricane", "Avalanche", "Earthquake", "Explosion"], 4, "All except Explosion are natural calamities."),
    q(["Ant", "Bee", "Moth", "Midge", "Spider"], 4, "All except Spider are insects having six legs."),
    q(["Flute", "Guitar", "Sitar", "Violin", "Veena"], 0, "All except Flute are string instruments."),
    q(["Treachery", "Fraud", "Deceit", "Swindle", "Morbid"], 4, "All except Morbid are synonyms of 'deceit'."),
    q(["Lima", "Algiers", "New York", "Tokyo", "Beijing"], 2, "All except New York are capital cities."),
    q(["Reader", "Writer", "Printer", "Publisher", "Reporter"], 0, "All except Reader are involved in preparing a journal."),
    q(["Arrow", "Axe", "Knife", "Dagger", "Sword"], 0, "All except Arrow are used while holding in hand."),
    q(["Feathers", "Tentacles", "Scales", "Pseudopodia", "Flagella"], 0, "All except Feathers are organs for movement in different organisms."),
    q(["Dog", "Horse", "Goat", "Cat", "Fox"], 4, "All except Fox are domestic animals; the fox is a wild animal."),
    q(["House", "Cottage", "School", "Palace", "Hut"], 2, "All except School are dwelling places."),
];

const CLASSIFICATION_SURVIVOR = [
    q(["Physics", "Chemistry", "Geography", "Botany", "Zoology"], 2, "All except Geography are branches of Science."),
    q(["Football", "Volleyball", "Cricket", "Chess", "Hockey"], 3, "All except Chess are outdoor games."),
    q(["Trunk", "Tree", "Fruit", "Leaf", "Flower"], 1, "All the others are parts of a tree."),
    q(["Giraffe", "Hyena", "Deer", "Rhinoceros", "Zebra"], 1, "Hyena is the only flesh-eating animal in the group."),
    q(["Poland", "Greece", "Spain", "Italy", "Korea"], 4, "All except Korea are European countries; Korea is Asian."),
    q(["Bajra", "Mustard", "Rice", "Wheat", "Barley"], 1, "All except Mustard are foodgrains; mustard is an oilseed."),
    q(["Cot", "Sheet", "Quilt", "Pillow", "Blanket"], 0, "All except Cot are parts of the bed-spread."),
    q(["Assassinate", "Kill", "Kidnap", "Stab", "Murder"], 2, "All except Kidnap are actions of killing."),
    q(["Doe", "Bitch", "Sorceress", "Drone", "Mare"], 3, "All except Drone are females."),
    q(["Gangtok", "Singhbhum", "Hyderabad", "Chennai", "Bhubaneshwar"], 1, "All except Singhbhum are capitals of Indian states."),
    q(["Turtle", "Lamb", "Colt", "Bitch", "Farrow"], 3, "All except Bitch are young ones of animals; a bitch is a female dog."),
    q(["Raid", "Attack", "Assault", "Defence", "Ambush"], 3, "All except Defence are forms of attack."),
    q(["Tomato", "Carrot", "Ginger", "Potato", "Turmeric"], 0, "All except Tomato grow underground."),
    q(["Car", "Scooter", "Helicopter", "Aeroplane", "Cycle"], 4, "All except Cycle run on fuel."),
    q(["Mother", "Friend", "Sister", "Father", "Brother"], 1, "All except Friend denote blood relations."),
    q(["Beaker", "Glass", "Mug", "Saucer", "Cup"], 3, "All except Saucer are used to contain liquids."),
    q(["Feeling", "Joy", "Anxiety", "Anger", "Sorrow"], 0, "All the others denote various feelings."),
    q(["Nanak", "Christ", "Buddha", "Gandhi", "Mahavira"], 3, "All except Gandhi are founders of religions."),
    q(["Book", "Paper", "Pencil", "Pen", "Sharpener"], 0, "All except Book are stationery items."),
    q(["Pound", "Yen", "Ounce", "Franc", "Dollar"], 2, "All except Ounce are currencies; an ounce is a unit of weight."),
    q(["Brick", "Heart", "Diamond", "Spade", "Club"], 0, "All except Brick are symbols on playing cards."),
    q(["Tomato", "Cucumber", "Brinjal", "Carrot", "Gourd"], 3, "Carrot is the only vegetable that grows underground."),
    q(["Coarse", "Unrefined", "Vulgar", "Oafish", "Blunt"], 4, "All except Blunt are synonyms."),
    q(["Seal", "Scorpion", "Fish", "Lion"], 0, "All except Seal are creatures associated with signs of the zodiac."),
    q(["Month", "Year", "Fortnight", "Season", "Week"], 3, "All except Season are precise measures of days."),
    q(["Kennel", "House", "Stable", "Aviary", "Aquarium"], 1, "All except House are places to rear one animal or another."),
    q(["Tortoise", "Duck", "Snake", "Whale", "Crow"], 3, "All except Whale lay eggs."),
    q(["Cliff", "Canyon", "Gulch", "Gorge", "Ravine"], 0, "All except Cliff are features associated with a river; a cliff is associated with the sea."),
    q(["Actor", "Artist", "Musician", "Dancer", "Poet"], 4, "All except Poet perform on stage."),
    q(["Sketch", "Diagram", "Poster", "Chart", "Paper"], 4, "All the others can be drawn on paper."),
    q(["Mew", "Howl", "Bark", "Grunt", "Shout"], 4, "All except Shout are sounds produced by animals."),
    q(["Hostel", "Hotel", "Inn", "Club", "Motel"], 3, "All except Club are places where people can stay."),
    q(["Blue", "Green", "White", "Yellow", "Violet"], 2, "All except White are colours of the rainbow."),
    q(["Fox", "Yak", "Bear", "Kangaroo", "Sheep"], 3, "All except Kangaroo have thick hair or fur on their skin."),
    q(["Trigger", "Muzzle", "Palette", "Barrel", "Bullet"], 2, "All except Palette are parts of a gun."),
    q(["Cigar", "Cigarette", "Tobacco", "Pipe", "Hookah"], 2, "All except Tobacco are means of smoking."),
    q(["Run", "Walk", "Think", "Jump", "Swim"], 2, "All except Think denote physical activities."),
    q(["Taste", "Chew", "Swallow", "Gulp", "Lick"], 0, "All except Taste are ways of eating."),
    q(["Sun", "Moon", "Star", "Planets", "Universe"], 4, "All except Universe form a part of the universe."),
    q(["Guava", "Litchi", "Papaya", "Watermelon", "Jackfruit"], 3, "All except Watermelon grow on trees; watermelon grows on creepers."),
    q(["Cabbage", "Papaya", "Gourd", "Cucumber", "Brinjal"], 1, "All except Papaya are vegetables; papaya is a fruit."),
    q(["Jordan", "Bhutan", "Turkey", "Norway", "Spain"], 2, "All except Turkey are countries ruled by kings."),
    q(["Engineer", "Architect", "Mechanic", "Mason", "Blacksmith"], 2, "All except Mechanic help in building a house."),
    q(["Sleet", "Fog", "Hailstone", "Vapour", "Mist"], 3, "All except Vapour are forms of precipitation."),
    q(["Lake", "Sea", "River", "Pool", "Pond"], 2, "All except River contain stagnant water."),
    q(["Cow", "Deer", "Donkey", "Rhinoceros", "Goat"], 2, "All except Donkey have horns."),
    q(["Rose", "Lotus", "Marigold", "Lily", "Tulip"], 1, "All except Lotus grow on land; the lotus grows in water."),
    q(["Metre", "Furlong", "Yard", "Mile", "Acre"], 4, "All except Acre are units of distance; an acre is a unit of area."),
    q(["Snore", "Slumber", "Yawn", "Doze", "Dream"], 2, "All except Yawn are actions in sleep; a yawn is a sign of boredom."),
    q(["Spade", "Spanner", "Shovel", "Rake", "Pick-axe"], 1, "All except Spanner are a labourer's tools; a spanner is used by a mechanic."),
];

const TESTS = [
    { slug: "challenge", topic: "Challenge Mode", format: "challenge", questions: CLASSIFICATION_CHALLENGE, blurb: "40 'odd one out' classification questions, graded like the real exam. One attempt, the leaderboard is live the moment you finish." },
    { slug: "survivor", topic: "Survivor Mode", format: "survivor", questions: CLASSIFICATION_SURVIVOR, blurb: "50 classification questions back to back. One attempt, see where you rank on the live leaderboard right after." },
];

// Publish both graded classification mocks once (per-test SeedFlag).
async function ensureClassificationMockTestsSeeded() {
    try {
        const owner =
            (await User.findOne({ role: { $in: ["superadmin", "admin"] } }).sort({ createdAt: 1 }).select("_id").lean()) ||
            (await User.findOne().sort({ createdAt: 1 }).select("_id").lean());
        if (!owner) {
            console.warn("[classification-mock] no user to attribute yet; will publish on a later boot");
            return;
        }

        for (const t of TESTS) {
            const key = `classification-mock-${t.slug}-v1`;
            if (await SeedFlag.exists({ key })) continue;

            const need = TEST_FORMATS[t.format].count;
            if (t.questions.length !== need) {
                console.warn(`[classification-mock] ${t.topic} has ${t.questions.length} questions, expected ${need}, skipped`);
                continue;
            }

            const docs = await Question.insertMany(
                t.questions.map((qq) => ({ ...qq, subject: "Reasoning", topic: "Classification", difficulty: "moderate", marks: 1, createdBy: owner._id }))
            );
            await Test.create({
                title: `Reasoning: Classification, ${t.topic}`,
                description: t.blurb,
                subject: "Reasoning",
                category: "topic-wise",
                format: t.format,
                mode: "test",
                durationMinutes: need,
                targets: [],
                questions: docs.map((d) => d._id),
                totalMarks: docs.length,
                status: "published",
                isPublished: true,
                createdBy: owner._id,
            });
            await SeedFlag.create({ key });
            console.log(`[classification-mock] published Classification ${TEST_FORMATS[t.format].label} (${docs.length} Q)`);
        }
    } catch (e) {
        console.warn("[classification-mock] seed skipped:", e.message);
    }
}

module.exports = { CLASSIFICATION_CHALLENGE, CLASSIFICATION_SURVIVOR, ensureClassificationMockTestsSeeded };
