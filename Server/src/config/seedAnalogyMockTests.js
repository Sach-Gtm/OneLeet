const Test = require("../models/testModel");
const Question = require("../models/questionModel");
const User = require("../models/userModel");
const SeedFlag = require("../models/seedFlagModel");
const { TEST_FORMATS } = require("./testFormats");

// Two graded analogy mock tests — a 40-question Challenge Mode and a
// 50-question Survivor Mode. All questions are original (moderate), written
// fresh across the standard analogy relationship types (home, tool, product,
// synonym, antonym, part–whole, cause–effect, squares/cubes, capital, currency,
// sound, category, degree, gender) rather than copied from any site. They're
// graded ("test") with no close window → lifetime access + a live leaderboard.

// Rotate each item's options by i%4 so the correct answer is spread across
// positions A–D instead of always landing in the same slot.
function spread(list) {
    return list.map((q, i) => {
        const n = q.options.length;
        const shift = i % n;
        const options = q.options.slice(shift).concat(q.options.slice(0, shift));
        const correctIndex = (q.correctIndex - shift + n) % n;
        return { ...q, options, correctIndex };
    });
}

const ANALOGY_CHALLENGE = spread([
    { text: "Bee : Hive :: Bird : ?", options: ["Sky", "Nest", "Tree", "Egg"], correctIndex: 1, explanation: "A hive is a bee's home; a nest is a bird's home." },
    { text: "Cow : Calf :: Horse : ?", options: ["Pony", "Colt", "Foal", "Mare"], correctIndex: 2, explanation: "The young of a horse is a foal." },
    { text: "India : New Delhi :: Japan : ?", options: ["Beijing", "Seoul", "Tokyo", "Osaka"], correctIndex: 2, explanation: "Tokyo is the capital of Japan." },
    { text: "Thermometer : Temperature :: Barometer : ?", options: ["Pressure", "Humidity", "Rain", "Heat"], correctIndex: 0, explanation: "A barometer measures atmospheric pressure." },
    { text: "Big : Large :: Happy : ?", options: ["Sad", "Glad", "Angry", "Calm"], correctIndex: 1, explanation: "Synonyms: big–large and happy–glad." },
    { text: "Hot : Cold :: Day : ?", options: ["Sun", "Morning", "Night", "Light"], correctIndex: 2, explanation: "Antonyms: hot–cold and day–night." },
    { text: "Wheel : Car :: Petal : ?", options: ["Stem", "Flower", "Leaf", "Root"], correctIndex: 1, explanation: "A wheel is part of a car; a petal is part of a flower." },
    { text: "Author : Book :: Composer : ?", options: ["Piano", "Song", "Symphony", "Stage"], correctIndex: 2, explanation: "An author creates a book; a composer creates a symphony." },
    { text: "Doctor : Hospital :: Teacher : ?", options: ["Book", "School", "Student", "Class"], correctIndex: 1, explanation: "A doctor works in a hospital; a teacher works in a school." },
    { text: "Fire : Smoke :: Rain : ?", options: ["Cloud", "Flood", "Water", "Storm"], correctIndex: 1, explanation: "Fire causes smoke; heavy rain causes a flood." },
    { text: "7 : 49 :: 9 : ?", options: ["72", "81", "90", "99"], correctIndex: 1, explanation: "Each number is squared: 9² = 81." },
    { text: "2 : 8 :: 3 : ?", options: ["9", "6", "27", "12"], correctIndex: 2, explanation: "Each number is cubed: 3³ = 27." },
    { text: "Pen : Write :: Knife : ?", options: ["Sharp", "Cut", "Blade", "Kitchen"], correctIndex: 1, explanation: "A pen is used to write; a knife is used to cut." },
    { text: "Dog : Bark :: Lion : ?", options: ["Growl", "Roar", "Howl", "Whine"], correctIndex: 1, explanation: "A dog barks; a lion roars." },
    { text: "Tree : Paper :: Cotton : ?", options: ["Thread", "Cloth", "Shirt", "Fibre"], correctIndex: 1, explanation: "Paper is made from trees; cloth is made from cotton." },
    { text: "King : Queen :: Lion : ?", options: ["Cub", "Tiger", "Lioness", "Tigress"], correctIndex: 2, explanation: "The female of a lion is a lioness." },
    { text: "Rose : Flower :: Mango : ?", options: ["Tree", "Fruit", "Juice", "Seed"], correctIndex: 1, explanation: "A rose is a flower; a mango is a fruit." },
    { text: "Warm : Hot :: Cool : ?", options: ["Cold", "Ice", "Breeze", "Mild"], correctIndex: 0, explanation: "Increasing degree: warm→hot, cool→cold." },
    { text: "Painter : Brush :: Farmer : ?", options: ["Crop", "Plough", "Field", "Seed"], correctIndex: 1, explanation: "A painter's tool is a brush; a farmer's is a plough." },
    { text: "Dog : Kennel :: Horse : ?", options: ["Farm", "Stable", "Barn", "Field"], correctIndex: 1, explanation: "A dog lives in a kennel; a horse in a stable." },
    { text: "France : Paris :: Egypt : ?", options: ["Cairo", "Giza", "Luxor", "Alexandria"], correctIndex: 0, explanation: "Cairo is the capital of Egypt." },
    { text: "Speedometer : Speed :: Seismograph : ?", options: ["Rain", "Earthquake", "Sound", "Heat"], correctIndex: 1, explanation: "A seismograph measures earthquakes." },
    { text: "Brave : Courageous :: Rich : ?", options: ["Poor", "Wealthy", "Greedy", "Famous"], correctIndex: 1, explanation: "Synonyms: brave–courageous and rich–wealthy." },
    { text: "Up : Down :: Win : ?", options: ["Play", "Lose", "Draw", "Score"], correctIndex: 1, explanation: "Antonyms: up–down and win–lose." },
    { text: "Page : Book :: Branch : ?", options: ["Leaf", "Tree", "Root", "Fruit"], correctIndex: 1, explanation: "A page is part of a book; a branch is part of a tree." },
    { text: "Poet : Poem :: Baker : ?", options: ["Oven", "Bread", "Flour", "Shop"], correctIndex: 1, explanation: "A poet makes a poem; a baker makes bread." },
    { text: "Judge : Court :: Pilot : ?", options: ["Airport", "Cockpit", "Sky", "Plane"], correctIndex: 1, explanation: "A judge works in a court; a pilot in a cockpit." },
    { text: "Virus : Disease :: Spark : ?", options: ["Fire", "Wire", "Light", "Smoke"], correctIndex: 0, explanation: "A virus causes disease; a spark causes fire." },
    { text: "5 : 25 :: 11 : ?", options: ["110", "121", "111", "132"], correctIndex: 1, explanation: "Each number is squared: 11² = 121." },
    { text: "4 : 64 :: 5 : ?", options: ["100", "125", "120", "150"], correctIndex: 1, explanation: "Each number is cubed: 5³ = 125." },
    { text: "Broom : Sweep :: Needle : ?", options: ["Cut", "Sew", "Prick", "Knit"], correctIndex: 1, explanation: "A broom is used to sweep; a needle to sew." },
    { text: "Cat : Mew :: Horse : ?", options: ["Bray", "Neigh", "Snort", "Trot"], correctIndex: 1, explanation: "A cat mews; a horse neighs." },
    { text: "Actor : Actress :: Nephew : ?", options: ["Cousin", "Niece", "Aunt", "Sister"], correctIndex: 1, explanation: "The female counterpart of a nephew is a niece." },
    { text: "Sparrow : Bird :: Shark : ?", options: ["Whale", "Fish", "Water", "Sea"], correctIndex: 1, explanation: "A sparrow is a bird; a shark is a fish." },
    { text: "Like : Love :: Dislike : ?", options: ["Hate", "Fear", "Anger", "Envy"], correctIndex: 0, explanation: "Increasing degree: like→love, dislike→hate." },
    { text: "Tailor : Needle :: Blacksmith : ?", options: ["Iron", "Hammer", "Fire", "Anvil"], correctIndex: 1, explanation: "A tailor's tool is a needle; a blacksmith's is a hammer." },
    { text: "Lion : Den :: Rabbit : ?", options: ["Hole", "Burrow", "Nest", "Cage"], correctIndex: 1, explanation: "A lion lives in a den; a rabbit in a burrow." },
    { text: "Italy : Rome :: Nepal : ?", options: ["Pokhara", "Kathmandu", "Lhasa", "Patna"], correctIndex: 1, explanation: "Kathmandu is the capital of Nepal." },
    { text: "Odometer : Distance :: Hygrometer : ?", options: ["Heat", "Humidity", "Height", "Weight"], correctIndex: 1, explanation: "A hygrometer measures humidity." },
    { text: "Begin : Start :: End : ?", options: ["Stop", "Finish", "Open", "Middle"], correctIndex: 1, explanation: "Synonyms: begin–start and end–finish." },
]);

const ANALOGY_SURVIVOR = spread([
    { text: "Sheep : Lamb :: Dog : ?", options: ["Kitten", "Puppy", "Cub", "Foal"], correctIndex: 1, explanation: "The young of a dog is a puppy." },
    { text: "USA : Dollar :: Japan : ?", options: ["Won", "Yen", "Yuan", "Baht"], correctIndex: 1, explanation: "The currency of Japan is the yen." },
    { text: "Sculptor : Chisel :: Painter : ?", options: ["Canvas", "Brush", "Colour", "Easel"], correctIndex: 1, explanation: "A sculptor uses a chisel; a painter a brush." },
    { text: "Small : Tiny :: Big : ?", options: ["Large", "Huge", "Wide", "Tall"], correctIndex: 1, explanation: "Increasing degree: small→tiny, big→huge." },
    { text: "Open : Close :: Rise : ?", options: ["Jump", "Fall", "Climb", "Grow"], correctIndex: 1, explanation: "Antonyms: open–close and rise–fall." },
    { text: "Room : House :: Chapter : ?", options: ["Page", "Book", "Word", "Line"], correctIndex: 1, explanation: "A room is part of a house; a chapter is part of a book." },
    { text: "Cobbler : Shoes :: Mason : ?", options: ["Brick", "Wall", "Cement", "House"], correctIndex: 1, explanation: "A cobbler makes shoes; a mason builds a wall." },
    { text: "Chef : Kitchen :: Sailor : ?", options: ["Sea", "Ship", "Port", "Deck"], correctIndex: 1, explanation: "A chef works in a kitchen; a sailor on a ship." },
    { text: "Injury : Pain :: Sun : ?", options: ["Moon", "Heat", "Day", "Sky"], correctIndex: 1, explanation: "An injury causes pain; the sun gives heat." },
    { text: "6 : 36 :: 8 : ?", options: ["48", "64", "56", "72"], correctIndex: 1, explanation: "Each number is squared: 8² = 64." },
    { text: "3 : 27 :: 4 : ?", options: ["16", "64", "48", "81"], correctIndex: 1, explanation: "Each number is cubed: 4³ = 64." },
    { text: "Key : Unlock :: Scissors : ?", options: ["Sharp", "Cut", "Metal", "Paper"], correctIndex: 1, explanation: "A key is used to unlock; scissors to cut." },
    { text: "Cow : Moo :: Snake : ?", options: ["Roar", "Hiss", "Buzz", "Bark"], correctIndex: 1, explanation: "A cow moos; a snake hisses." },
    { text: "Milk : Cheese :: Grapes : ?", options: ["Juice", "Wine", "Jam", "Vinegar"], correctIndex: 1, explanation: "Cheese is made from milk; wine from grapes." },
    { text: "Bull : Cow :: Cock : ?", options: ["Chick", "Hen", "Duck", "Bird"], correctIndex: 1, explanation: "The female of a cock (rooster) is a hen." },
    { text: "Cricket : Sport :: Copper : ?", options: ["Coin", "Metal", "Wire", "Mineral"], correctIndex: 1, explanation: "Cricket is a sport; copper is a metal." },
    { text: "Sad : Miserable :: Happy : ?", options: ["Glad", "Ecstatic", "Calm", "Pleased"], correctIndex: 1, explanation: "Increasing degree: sad→miserable, happy→ecstatic." },
    { text: "Barber : Scissors :: Cook : ?", options: ["Food", "Ladle", "Fire", "Plate"], correctIndex: 1, explanation: "A barber's tool is scissors; a cook's is a ladle." },
    { text: "Pig : Sty :: Eagle : ?", options: ["Nest", "Eyrie", "Cliff", "Tree"], correctIndex: 1, explanation: "A pig lives in a sty; an eagle in an eyrie." },
    { text: "China : Beijing :: Australia : ?", options: ["Sydney", "Canberra", "Melbourne", "Perth"], correctIndex: 1, explanation: "Canberra is the capital of Australia." },
    { text: "Ammeter : Current :: Anemometer : ?", options: ["Rain", "Wind", "Sound", "Heat"], correctIndex: 1, explanation: "An anemometer measures wind speed." },
    { text: "Fast : Quick :: Smart : ?", options: ["Dull", "Clever", "Slow", "Weak"], correctIndex: 1, explanation: "Synonyms: fast–quick and smart–clever." },
    { text: "Accept : Reject :: Expand : ?", options: ["Grow", "Contract", "Widen", "Stretch"], correctIndex: 1, explanation: "Antonyms: accept–reject and expand–contract." },
    { text: "Root : Plant :: Key : ?", options: ["Lock", "Keyboard", "Door", "Piano"], correctIndex: 1, explanation: "A root is part of a plant; a key is part of a keyboard." },
    { text: "Weaver : Cloth :: Potter : ?", options: ["Clay", "Pot", "Wheel", "Mud"], correctIndex: 1, explanation: "A weaver makes cloth; a potter makes pots." },
    { text: "Actor : Stage :: Scientist : ?", options: ["Experiment", "Laboratory", "Discovery", "School"], correctIndex: 1, explanation: "An actor works on a stage; a scientist in a laboratory." },
    { text: "Study : Knowledge :: Exercise : ?", options: ["Gym", "Fitness", "Health", "Body"], correctIndex: 1, explanation: "Study builds knowledge; exercise builds fitness." },
    { text: "12 : 144 :: 13 : ?", options: ["156", "169", "143", "196"], correctIndex: 1, explanation: "Each number is squared: 13² = 169." },
    { text: "5 : 125 :: 6 : ?", options: ["180", "216", "150", "200"], correctIndex: 1, explanation: "Each number is cubed: 6³ = 216." },
    { text: "Lamp : Light :: Fan : ?", options: ["Heat", "Air", "Noise", "Motor"], correctIndex: 1, explanation: "A lamp gives light; a fan gives air." },
    { text: "Duck : Quack :: Wolf : ?", options: ["Bark", "Howl", "Growl", "Roar"], correctIndex: 1, explanation: "A duck quacks; a wolf howls." },
    { text: "Uncle : Aunt :: Son : ?", options: ["Child", "Daughter", "Sister", "Mother"], correctIndex: 1, explanation: "The female counterpart of a son is a daughter." },
    { text: "Oak : Tree :: Ruby : ?", options: ["Stone", "Gem", "Rock", "Red"], correctIndex: 1, explanation: "An oak is a tree; a ruby is a gem." },
    { text: "Good : Excellent :: Bad : ?", options: ["Worse", "Terrible", "Poor", "Evil"], correctIndex: 1, explanation: "Increasing degree: good→excellent, bad→terrible." },
    { text: "Gardener : Spade :: Woodcutter : ?", options: ["Tree", "Axe", "Log", "Forest"], correctIndex: 1, explanation: "A gardener's tool is a spade; a woodcutter's is an axe." },
    { text: "Pigeon : Loft :: Hen : ?", options: ["Nest", "Coop", "Cage", "Sty"], correctIndex: 1, explanation: "A pigeon lives in a loft; a hen in a coop." },
    { text: "Spain : Madrid :: Canada : ?", options: ["Toronto", "Ottawa", "Vancouver", "Montreal"], correctIndex: 1, explanation: "Ottawa is the capital of Canada." },
    { text: "Ruler : Length :: Clock : ?", options: ["Weight", "Time", "Speed", "Heat"], correctIndex: 1, explanation: "A ruler measures length; a clock measures time." },
    { text: "Angry : Furious :: Tired : ?", options: ["Sleepy", "Exhausted", "Lazy", "Weak"], correctIndex: 1, explanation: "Increasing degree: angry→furious, tired→exhausted." },
    { text: "Ancient : Modern :: Victory : ?", options: ["War", "Defeat", "Battle", "Loss"], correctIndex: 1, explanation: "Antonyms: ancient–modern and victory–defeat." },
    { text: "Leaf : Tree :: Star : ?", options: ["Sky", "Constellation", "Moon", "Night"], correctIndex: 1, explanation: "A leaf is part of a tree; a star is part of a constellation." },
    { text: "Carpenter : Furniture :: Tailor : ?", options: ["Cloth", "Garment", "Needle", "Shop"], correctIndex: 1, explanation: "A carpenter makes furniture; a tailor makes garments." },
    { text: "Farmer : Field :: Miner : ?", options: ["Coal", "Mine", "Tunnel", "Cave"], correctIndex: 1, explanation: "A farmer works in a field; a miner in a mine." },
    { text: "Practice : Perfection :: Wound : ?", options: ["Blood", "Scar", "Pain", "Cut"], correctIndex: 1, explanation: "Practice leads to perfection; a wound leaves a scar." },
    { text: "8 : 64 :: 10 : ?", options: ["80", "100", "120", "1000"], correctIndex: 1, explanation: "Each number is squared: 10² = 100." },
    { text: "1 : 1 :: 10 : ?", options: ["10", "100", "1000", "10000"], correctIndex: 2, explanation: "Each number is cubed: 10³ = 1000." },
    { text: "Brake : Stop :: Accelerator : ?", options: ["Slow", "Speed", "Turn", "Halt"], correctIndex: 1, explanation: "A brake stops a vehicle; an accelerator speeds it up." },
    { text: "Frog : Croak :: Bee : ?", options: ["Hum", "Buzz", "Sting", "Fly"], correctIndex: 1, explanation: "A frog croaks; a bee buzzes." },
    { text: "Horse : Mare :: Dog : ?", options: ["Puppy", "Bitch", "Pup", "Kennel"], correctIndex: 1, explanation: "The female of a horse is a mare; of a dog, a bitch." },
    { text: "Diamond : Gem :: Iron : ?", options: ["Ore", "Metal", "Steel", "Mineral"], correctIndex: 1, explanation: "A diamond is a gem; iron is a metal." },
]);

const TESTS = [
    { slug: "challenge", topic: "Challenge Mode", format: "challenge", questions: ANALOGY_CHALLENGE, blurb: "40 analogy questions, graded like the real exam. One attempt, the leaderboard is live the moment you finish." },
    { slug: "survivor", topic: "Survivor Mode", format: "survivor", questions: ANALOGY_SURVIVOR, blurb: "50 analogy questions back to back. One attempt, see where you rank on the live leaderboard right after." },
];

// Publish both graded analogy mocks once (per-test SeedFlag). Mode "test" with no
// close window → lifetime access + a live leaderboard immediately after submit.
async function ensureAnalogyMockTestsSeeded() {
    try {
        const owner =
            (await User.findOne({ role: { $in: ["superadmin", "admin"] } }).sort({ createdAt: 1 }).select("_id").lean()) ||
            (await User.findOne().sort({ createdAt: 1 }).select("_id").lean());
        if (!owner) {
            console.warn("[analogy-mock] no user to attribute yet; will publish on a later boot");
            return;
        }

        for (const t of TESTS) {
            const key = `analogy-mock-${t.slug}-v1`;
            if (await SeedFlag.exists({ key })) continue;

            const need = TEST_FORMATS[t.format].count;
            if (t.questions.length !== need) {
                console.warn(`[analogy-mock] ${t.topic} has ${t.questions.length} questions, expected ${need}, skipped`);
                continue;
            }

            const docs = await Question.insertMany(
                t.questions.map((q) => ({ ...q, subject: "Reasoning", topic: "Analogy", difficulty: "moderate", marks: 1, createdBy: owner._id }))
            );
            await Test.create({
                title: `Reasoning: Analogy, ${t.topic}`,
                description: t.blurb,
                subject: "Reasoning",
                category: "topic-wise",
                format: t.format,
                mode: "test", // graded + ranked
                durationMinutes: need, // ~1 min per question
                targets: [], // reasoning is common to every LEET
                questions: docs.map((d) => d._id),
                totalMarks: docs.length,
                status: "published",
                isPublished: true,
                createdBy: owner._id,
            });
            await SeedFlag.create({ key });
            console.log(`[analogy-mock] published Analogy ${TEST_FORMATS[t.format].label} (${docs.length} Q)`);
        }
    } catch (e) {
        console.warn("[analogy-mock] seed skipped:", e.message);
    }
}

module.exports = { ANALOGY_CHALLENGE, ANALOGY_SURVIVOR, ensureAnalogyMockTestsSeeded };
