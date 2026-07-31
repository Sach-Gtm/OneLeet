const Test = require("../models/testModel");
const Question = require("../models/questionModel");
const User = require("../models/userModel");
const SeedFlag = require("../models/seedFlagModel");
const { TEST_FORMATS } = require("./testFormats");

// Two graded "Odd One Out" mock tests — a 40-question Challenge Mode and a
// 50-question Survivor Mode. Most items come from examveda (which the founder
// has permission to use), reproduced faithfully; two obvious source spellings
// were corrected ("Jackle" → "Jackal", "Milet" → "Millet"). To keep this test
// genuinely different from the word-only Classification mocks, every examveda
// item that duplicated a Classification question (or whose keyed answer was
// ambiguous) was dropped, and the shortfall was topped up with freshly authored
// number-series / letter-group / number-pair items — the mixed-format flavour
// that "Odd One Out" is really about. Graded ("test") with no close window →
// lifetime access + a live leaderboard the moment you finish.

const STEM = "Find the odd one out.";
const q = (options, correctIndex, explanation) => ({ text: STEM, options, correctIndex, explanation });

const ODDONEOUT_CHALLENGE = [
    q(["Swimming", "Sailing", "Diving", "Driving"], 3, "All except driving are water sports."),
    q(["49", "64", "81", "100", "96"], 4, "All except 96 are perfect squares (7², 8², 9², 10²)."),
    q(["Beam", "Pillar", "House", "Wall"], 2, "A beam, pillar and wall are parts of a house; the house is the whole structure."),
    q(["5720", "6710", "2640", "4270"], 3, "Each number except 4270 is exactly divisible by 11."),
    q(["Lion", "Tiger", "Fox", "Jackal", "Deer"], 4, "All except the deer are carnivores; the deer is a herbivore."),
    q(["PQXZ", "CQBN", "ABDF", "PRMN"], 2, "Only ABDF contains a vowel (A); the other groups are made up entirely of consonants."),
    q(["Discernment", "Perception", "Penetration", "Insinuation"], 3, "All except insinuation mean keen insight; an insinuation is a sly, indirect hint."),
    q(["23", "29", "31", "37", "39"], 4, "All except 39 are prime numbers (39 = 3 × 13)."),
    q(["Delhi", "Mumbai", "Kolkata", "Rangoon"], 3, "All except Rangoon are Indian cities; Rangoon (Yangon) is in Myanmar."),
    q(["ABYZ", "CDWX", "EFUV", "GHTV"], 3, "In each group the first two letters count up from the start (AB, CD, EF, GH) and the last two count down from the end (YZ, WX, UV); GH should pair with ST, not TV."),
    q(["Garlic", "Chilli", "Ginger", "Potato", "Sugar beet"], 1, "All except the chilli grow underground; the chilli grows above the ground."),
    q(["16 – 18", "56 – 63", "96 – 108", "86 – 99"], 3, "Each pair is in the ratio 8 : 9 (16:18, 56:63, 96:108); 86 : 99 is not (that would be 88 : 99)."),
    q(["Teacher", "Principal", "Student", "Lecturer"], 2, "All except the student are members of a school's teaching staff."),
    q(["27", "64", "125", "216", "100"], 4, "All except 100 are perfect cubes (3³, 4³, 5³, 6³)."),
    q(["Square", "Triangle", "Area", "Rectangle"], 2, "All except area are geometrical shapes; area is a measurement."),
    q(["FBI", "QMT", "VRY", "HEK"], 3, "In FBI, QMT and VRY the first letter is 4 behind the second and the third is 7 ahead of it; HEK breaks both steps."),
    q(["Manure", "Nitrogen", "Ammonia", "Urea", "Potash"], 1, "All except nitrogen are fertilizers; nitrogen is a nutrient element."),
    q(["Bird", "Kite", "Crow", "Sparrow"], 0, "A kite, crow and sparrow are particular birds; 'bird' is the general class."),
    q(["91", "105", "119", "133", "120"], 4, "All except 120 are multiples of 7 (7 × 13, 15, 17, 19)."),
    q(["Night – Day", "Sun – Moon", "White – Black", "Light – Dark"], 1, "The other pairs are opposites; the sun and the moon are not opposites."),
    q(["Mustard", "Sesame", "Corn", "Olive", "Onion"], 4, "All except the onion yield edible oil."),
    q(["XT", "RL", "JF", "PL"], 1, "In each pair the two letters are 4 apart (X-T, J-F, P-L); R and L are 6 apart."),
    q(["Bowl", "Spoon", "Cup", "Bouquet"], 3, "All except the bouquet are items of crockery or cutlery; a bouquet is a bunch of flowers."),
    q(["Camels and Roar", "Dogs and Bark", "Birds and Chirp", "Horse and Neigh"], 0, "Each pair links an animal with its sound; camels do not roar."),
    q(["108", "126", "135", "150", "162"], 3, "All except 150 are divisible by 9."),
    q(["Seminar", "Semicolon", "Semifinal", "Semicircle", "Semitone"], 0, "In all except 'seminar' the prefix 'semi' means half."),
    q(["Pen and Nib", "Water and Bucket", "Ink and Inkpot", "Oil and Lamp"], 0, "The other pairs are a liquid and the vessel that holds it; a nib is a part of a pen, not its container."),
    q(["FIL", "RUX", "ILO", "LOQ"], 3, "In FIL, RUX and ILO each letter is 3 ahead of the previous one; in LOQ the last step is only 2."),
    q(["Wheat", "Barley", "Rice", "Pea", "Mustard"], 2, "All except rice are rabi (winter) crops; rice is a kharif crop."),
    q(["Fish and Aquarium", "Bird and Nest", "Student and Teacher", "Criminals and Prison"], 2, "Each pair links a creature with where it is kept or lives; a teacher is not a student's dwelling."),
    q(["Brick", "Cement", "Sand", "Wall"], 3, "Brick, cement and sand are building materials; a wall is what is built from them."),
    q(["Housefly", "Spider", "Mosquito", "Butterfly", "Cockroach"], 1, "All except the spider are insects (six legs); a spider is an arachnid (eight legs)."),
    q(["Tea and Coffee", "Pencil and Pen", "Cycle and Scooter", "Shirt and Tailor"], 3, "The other pairs are two similar things; a tailor makes a shirt."),
    q(["Zinc", "Iron", "Aluminium", "Copper", "Mercury"], 4, "All except mercury are solid at room temperature; mercury is a liquid metal."),
    q(["Rabbit", "Parrot", "Pigeon", "Crow"], 0, "A parrot, pigeon and crow are birds; the rabbit is not."),
    q(["626", "841", "962", "1090"], 1, "Each number except 841 is one more than a perfect square (625+1, 961+1, 1089+1); 841 = 29²."),
    q(["Tiger", "Dolphin", "Zebra", "Lion", "Crocodile"], 4, "All except the crocodile are mammals; the crocodile is a reptile."),
    q(["King", "Queen", "Bishop", "Minister", "Knight"], 3, "All except the minister are pieces on a chessboard."),
    q(["Tonnes", "Quintals", "Grams", "Kilograms", "Kilometres"], 4, "All except kilometres are units of weight; a kilometre measures distance."),
    q(["Mars", "Sun", "Saturn", "Mercury", "Pluto"], 1, "All except the sun are bodies that orbit it; the sun is a star."),
];

const ODDONEOUT_SURVIVOR = [
    q(["Tortoise", "Frog", "Rat", "Mongoose", "Snake"], 4, "All except the snake have legs."),
    q(["18", "27", "36", "45", "52"], 4, "In all except 52 the two digits add up to 9."),
    q(["Volume", "Size", "Large", "Shape", "Weight"], 2, "All except 'large' are measurable properties of an object; 'large' is only a description."),
    q(["BCD", "FGH", "LMN", "PQS"], 3, "Each group is three consecutive letters, except PQS (P, Q, then S skips R)."),
    q(["Rice", "Maize", "Jowar", "Bajra", "Wheat"], 4, "All except wheat are kharif crops; wheat is a rabi crop."),
    q(["Walk", "Pull", "Hear", "Jump", "Run"], 2, "All except 'hear' are physical movements of the body; hearing is a sense."),
    q(["121", "132", "143", "154", "160"], 4, "All except 160 are multiples of 11."),
    q(["Dog", "Lion", "Jackal", "Tiger", "Cheetah"], 0, "All except the dog are wild animals; the dog is domesticated."),
    q(["Apple", "Mango", "Orange", "Pear", "Papaya"], 1, "All except the mango have many seeds; the mango has a single large stone."),
    q(["ACE", "EGI", "KMO", "SUX"], 3, "In each group the letters are two apart (A-C-E, E-G-I, K-M-O); SUX breaks this (U to X is three)."),
    q(["Spade", "Knife", "Axe", "Hammer", "Blacksmith"], 4, "All except the blacksmith are tools; the blacksmith is the person who uses them."),
    q(["House", "Wall", "Roof", "Beam"], 0, "A wall, roof and beam are parts of a house; the house is the whole."),
    q(["12", "15", "18", "21", "26"], 4, "All except 26 are divisible by 3."),
    q(["Bullock", "Giraffe", "Ass", "Camel", "Donkey"], 1, "All except the giraffe are used as beasts of burden."),
    q(["Pineapple", "Orange", "Malta", "Banana", "Lemon"], 3, "All except the banana are sour, acidic fruits; the banana is sweet."),
    q(["3 – 9", "4 – 16", "5 – 25", "6 – 30"], 3, "In each pair the second number is the square of the first, except 6 – 30 (6² = 36)."),
    q(["Ink", "Paper", "Pen", "Pencil", "Sharpener"], 4, "All except the sharpener are writing materials; a sharpener only sharpens a pencil."),
    q(["Arc", "Diagonal", "Tangent", "Radius", "Diameter"], 1, "All except 'diagonal' are associated with a circle; a diagonal belongs to a polygon."),
    q(["34", "56", "78", "90", "63"], 4, "All except 63 are even numbers."),
    q(["Write", "Read", "Knowledge", "Learn", "Study"], 2, "All except 'knowledge' are actions; knowledge is the result of those actions."),
    q(["Goat", "Puppy", "Cow", "Buffalo"], 1, "All except the puppy are adult animals; a puppy is a young one."),
    q(["AZ", "BY", "CX", "DV"], 3, "In each pair the two letters are equal distances from the two ends of the alphabet (A–Z, B–Y, C–X); D pairs with W, not V."),
    q(["Zail Singh", "V. V. Giri", "Zakir Hussain", "Rajiv Gandhi", "Dr. Rajendra Prasad"], 3, "All except Rajiv Gandhi served as President of India; Rajiv Gandhi was a Prime Minister."),
    q(["Again", "Before", "Now", "After", "Then"], 0, "All except 'again' indicate a point in time; 'again' indicates repetition."),
    q(["7 – 21", "8 – 24", "9 – 27", "11 – 30"], 3, "In each pair the second number is three times the first, except 11 – 30 (11 × 3 = 33)."),
    q(["Screw", "Hammer", "Needle", "Pin", "Nail"], 1, "All except the hammer are pointed and pierce; the hammer drives them in."),
    q(["Cool", "Warm", "Sultry", "Hot", "Humid"], 0, "All except 'cool' describe warm or hot weather."),
    q(["40", "55", "70", "85", "92"], 4, "All except 92 are multiples of 5."),
    q(["Tomato", "Gourd", "Brinjal", "Cucumber", "Potato"], 4, "All except the potato grow above the ground; the potato grows underground."),
    q(["Father", "Mother", "Aunt", "Uncle", "Cousin"], 4, "All except the cousin belong to an elder generation; a cousin is of one's own generation."),
    q(["2 – 8", "3 – 27", "4 – 64", "5 – 100"], 3, "In each pair the second number is the cube of the first, except 5 – 100 (5³ = 125)."),
    q(["Up", "Down", "Below", "Above", "Small"], 4, "All except 'small' indicate position or direction; 'small' indicates size."),
    q(["Pituitary", "Pancreas", "Thalamus", "Adrenal", "Testis"], 2, "All except the thalamus are endocrine glands; the thalamus is part of the brain."),
    q(["11", "22", "33", "44", "54"], 4, "In all except 54 the two digits are the same."),
    q(["Big", "Small", "Trivial", "Tiny", "Huge"], 2, "All except 'trivial' describe size; 'trivial' means unimportant."),
    q(["Dispur", "Panaji", "Shimla", "Leh", "Aizawl"], 3, "All except Leh are capitals of Indian states."),
    q(["Plassey", "Haldighati", "Panipat", "Sarnath", "Kurukshetra"], 3, "All except Sarnath are famous battlefields; Sarnath is a Buddhist pilgrimage site."),
    q(["Attlee", "Bevin", "Chamberlain", "Churchill"], 1, "All except Bevin were British Prime Ministers; Ernest Bevin was a Foreign Secretary."),
    q(["Corn", "Wheat", "Cotton", "Jowar", "Millet"], 2, "All except cotton are food (cereal) crops; cotton is a fibre crop."),
    q(["Valley", "Sea", "Tower", "Mountain", "River"], 2, "All except the tower are natural features; a tower is man-made."),
    q(["See", "Hear", "Smell", "Taste", "Think"], 4, "All except 'think' relate to the five senses; thinking is a mental act."),
    q(["Necklace", "Ornament", "Bangle", "Ring"], 1, "A necklace, bangle and ring are particular ornaments; 'ornament' is the general class."),
    q(["Uncle", "Nephew", "Brother", "Cousin", "Niece"], 2, "All except 'brother' are extended-family relations; a brother is an immediate relation."),
    q(["Medium", "Average", "Mediocre", "Terrible"], 3, "Medium, average and mediocre all mean middling; 'terrible' means very bad."),
    q(["Stick", "Needle", "Thorn", "Pin", "Nail"], 0, "All except the stick are sharp and can prick; a stick is blunt."),
    q(["Rectangle", "Square", "Cube", "Triangle"], 2, "All except the cube are two-dimensional figures; a cube is three-dimensional."),
    q(["Konarak", "Madurai", "Ellora", "Khajuraho", "Dilwara"], 2, "All except Ellora are famous for their temples; Ellora is famous for its rock-cut caves."),
    q(["Polyester", "Cotton", "Terylene", "Nylon"], 1, "All except cotton are synthetic (man-made) fibres; cotton is natural."),
    q(["Cement", "Paste", "Oil", "Glue"], 2, "All except oil are adhesives used to stick things together; oil is a lubricant."),
    q(["Veena", "Sitar", "Drum", "Guitar"], 2, "All except the drum are stringed instruments; a drum is a percussion instrument."),
];

const TESTS = [
    { slug: "challenge", topic: "Challenge Mode", format: "challenge", questions: ODDONEOUT_CHALLENGE, blurb: "40 'odd one out' questions — numbers, letters, pairs and words — graded like the real exam. One attempt; the leaderboard is live the moment you finish." },
    { slug: "survivor", topic: "Survivor Mode", format: "survivor", questions: ODDONEOUT_SURVIVOR, blurb: "50 mixed 'odd one out' puzzles back to back. One attempt — see where you rank on the live leaderboard right after." },
];

// Publish both graded Odd One Out mocks once (per-test SeedFlag).
async function ensureOddOneOutMockTestsSeeded() {
    try {
        const owner =
            (await User.findOne({ role: { $in: ["superadmin", "admin"] } }).sort({ createdAt: 1 }).select("_id").lean()) ||
            (await User.findOne().sort({ createdAt: 1 }).select("_id").lean());
        if (!owner) {
            console.warn("[oddoneout-mock] no user to attribute yet; will publish on a later boot");
            return;
        }

        for (const t of TESTS) {
            const key = `oddoneout-mock-${t.slug}-v1`;
            if (await SeedFlag.exists({ key })) continue;

            const need = TEST_FORMATS[t.format].count;
            if (t.questions.length !== need) {
                console.warn(`[oddoneout-mock] ${t.topic} has ${t.questions.length} questions, expected ${need} — skipped`);
                continue;
            }

            const docs = await Question.insertMany(
                t.questions.map((qq) => ({ ...qq, subject: "Reasoning", topic: "Odd One Out", difficulty: "moderate", marks: 1, createdBy: owner._id }))
            );
            await Test.create({
                title: `Reasoning: Odd One Out — ${t.topic}`,
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
            console.log(`[oddoneout-mock] published Odd One Out ${TEST_FORMATS[t.format].label} (${docs.length} Q)`);
        }
    } catch (e) {
        console.warn("[oddoneout-mock] seed skipped:", e.message);
    }
}

module.exports = { ODDONEOUT_CHALLENGE, ODDONEOUT_SURVIVOR, ensureOddOneOutMockTestsSeeded };
