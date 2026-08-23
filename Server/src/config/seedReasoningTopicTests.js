const Test = require("../models/testModel");
const Question = require("../models/questionModel");
const User = require("../models/userModel");
const SeedFlag = require("../models/seedFlagModel");
const { TEST_FORMATS } = require("./testFormats");

// A batch of topic-wise Reasoning sets. Some questions come from examveda (which
// the founder has permission to use), reproduced faithfully; the rest are freshly
// authored, general-exam-focused questions whose answers are all worked out and
// verified. "Missing Number" and "Verbal Reasoning" are authored in full because
// examveda's versions are image-based figures / long passages that don't survive
// as plain text; every authored item has a single, unambiguous answer.
//
// `mode` follows what each set is for: repeatable "practice" (answers reveal as
// you go) for the drills, and graded "test" (one attempt, live leaderboard) for
// Blood Relations, Data Sufficiency and Syllogisms.

// ── Standard option banks for the verbal-logic families ──
const ASSUMPTION_OPTS = [
    "Only assumption I is implicit",
    "Only assumption II is implicit",
    "Either I or II is implicit",
    "Neither I nor II is implicit",
    "Both I and II are implicit",
];
const ARGUMENT_OPTS = [
    "Only argument I is strong",
    "Only argument II is strong",
    "Either I or II is strong",
    "Neither I nor II is strong",
    "Both I and II are strong",
];
const CONCLUSION_OPTS = [
    "Only conclusion I follows",
    "Only conclusion II follows",
    "Either I or II follows",
    "Neither I nor II follows",
    "Both I and II follow",
];
const DS_OPTS = [
    "Statement I alone is sufficient, but statement II alone is not sufficient",
    "Statement II alone is sufficient, but statement I alone is not sufficient",
    "Either statement I or statement II alone is sufficient",
    "Neither statement I nor statement II is sufficient",
    "Both statements I and II together are sufficient",
];

// Builders keep the multi-part text on ONE line (the test UI renders the stem in
// a plain <p>, so newlines would collapse anyway).
const q = (text, options, correctIndex, explanation) => ({ text, options, correctIndex, explanation });
const assumption = (statement, a1, a2, correctIndex, explanation) => ({
    text: `Statement: "${statement}"  Assumptions: (I) ${a1}  (II) ${a2}.  Which of the assumptions is implicit in the statement?`,
    options: ASSUMPTION_OPTS,
    correctIndex,
    explanation,
});
const argument = (question, a1, a2, correctIndex, explanation) => ({
    text: `${question}  Arguments: (I) ${a1}  (II) ${a2}.  Which of the arguments is strong?`,
    options: ARGUMENT_OPTS,
    correctIndex,
    explanation,
});
const conclusion = (statement, c1, c2, correctIndex, explanation) => ({
    text: `Statement: "${statement}"  Conclusions: (I) ${c1}  (II) ${c2}.  Which of the conclusions logically follows?`,
    options: CONCLUSION_OPTS,
    correctIndex,
    explanation,
});
const syllogism = (statements, c1, c2, correctIndex, explanation) => ({
    text: `Statements: ${statements}  Conclusions: (I) ${c1}  (II) ${c2}.  Which of the conclusions logically follows (assume the statements true even if they seem odd)?`,
    options: CONCLUSION_OPTS,
    correctIndex,
    explanation,
});
const ds = (question, s1, s2, correctIndex, explanation) => ({
    text: `${question}  To answer, which statement(s) are sufficient? Statements: (I) ${s1}  (II) ${s2}`,
    options: DS_OPTS,
    correctIndex,
    explanation,
});

// ── 1. Missing Number (25, authored) — number matrices & series ──
const MISSING_NUMBER = [
    q("Find the missing number in the grid (given row by row): (7, 2, 9), (8, 5, 13), (6, 9, ?).", ["13", "14", "15", "16"], 2, "In each row the third number is the sum of the first two: 6 + 9 = 15."),
    q("Find the missing number in the grid (row by row): (3, 4, 12), (5, 2, 10), (6, 7, ?).", ["36", "40", "42", "48"], 2, "In each row the third number is the product of the first two: 6 × 7 = 42."),
    q("Find the missing number in the grid (row by row): (9, 4, 5), (8, 3, 5), (12, 7, ?).", ["4", "5", "6", "7"], 1, "In each row the third number is the difference of the first two: 12 − 7 = 5."),
    q("Find the missing term in the series: 2, 5, 10, 17, 26, ?", ["35", "36", "37", "39"], 2, "The terms are 1²+1, 2²+1, 3²+1, 4²+1, 5²+1, so next is 6²+1 = 37."),
    q("Find the missing term in the series: 4, 9, 16, 25, 36, ?", ["42", "45", "49", "64"], 2, "Perfect squares 2², 3², 4², 5², 6², so next is 7² = 49."),
    q("Find the missing term in the series: 1, 8, 27, 64, ?", ["100", "121", "125", "144"], 2, "Perfect cubes 1³, 2³, 3³, 4³, so next is 5³ = 125."),
    q("Find the missing term in the series: 3, 6, 12, 24, 48, ?", ["72", "84", "96", "108"], 2, "Each term doubles: 48 × 2 = 96."),
    q("Find the missing term in the series: 5, 11, 23, 47, ?", ["83", "91", "95", "99"], 2, "Each term is (previous × 2) + 1: 47 × 2 + 1 = 95."),
    q("Find the missing number in the magic square (row by row): (8, 1, 6), (3, 5, 7), (4, ?, 2).", ["7", "8", "9", "10"], 2, "Every row and column sums to 15: 4 + ? + 2 = 15, so ? = 9."),
    q("Find the missing term in the series: 96, 48, 24, 12, ?", ["4", "6", "8", "10"], 1, "Each term is half the previous one: 12 ÷ 2 = 6."),
    q("Find the next letter in the series: C, E, G, I, ?", ["J", "K", "L", "M"], 1, "Letters advance by 2 each time: I + 2 = K."),
    q("Find the next letter in the series: B, D, H, N, ?", ["T", "U", "V", "W"], 2, "Gaps grow +2, +4, +6, +8: N (14) + 8 = V (22)."),
    q("Find the missing letter (each row follows the same rule): (C, E, H), (D, F, J), (B, G, ?).", ["H", "I", "K", "L"], 1, "The third letter's position equals the sum of the first two: B(2) + G(7) = 9 = I."),
    q("Find the missing term in the series: 7, 14, 28, 56, ?", ["84", "98", "112", "126"], 2, "Each term doubles: 56 × 2 = 112."),
    q("Find the missing number in the grid (row by row): (4, 5, 6), (7, 3, 5), (8, ?, 1).", ["5", "6", "7", "8"], 1, "Each row sums to 15: 8 + ? + 1 = 15, so ? = 6."),
    q("Find the missing term in the series: 11, 13, 17, 19, 23, ?", ["25", "27", "29", "31"], 2, "The series lists consecutive prime numbers; after 23 comes 29."),
    q("Find the missing term in the series: 2, 3, 5, 7, 11, 13, ?", ["15", "16", "17", "19"], 2, "Consecutive primes; after 13 comes 17."),
    q("Find the missing term in the series: 1, 4, 9, 16, 25, ?, 49", ["30", "32", "36", "40"], 2, "Perfect squares; the missing one is 6² = 36."),
    q("Find the missing number in the grid (row by row): (10, 2, 5), (12, 3, 4), (20, 4, ?).", ["4", "5", "6", "8"], 1, "In each row the third number is the first divided by the second: 20 ÷ 4 = 5."),
    q("Find the missing term in the series: 5, 8, 14, 26, 50, ?", ["96", "98", "100", "102"], 1, "Each term is (previous × 2) − 2: 50 × 2 − 2 = 98."),
    q("Find the next letter in the series: Z, X, V, T, ?", ["S", "R", "Q", "P"], 1, "Letters go back by 2 each time: T − 2 = R."),
    q("Find the missing term in the series: 6, 11, 21, 36, 56, ?", ["76", "81", "86", "91"], 1, "Gaps grow +5, +10, +15, +20, +25: 56 + 25 = 81."),
    q("Find the missing number in the grid (row by row): (4, 7, 11), (6, 5, 11), (9, ?, 11).", ["2", "3", "4", "5"], 0, "In each row the first two numbers add up to 11: 9 + ? = 11, so ? = 2."),
    q("Find the missing term in the series: 3, 5, 9, 17, 33, ?", ["63", "65", "67", "69"], 1, "Each term is (previous × 2) − 1: 33 × 2 − 1 = 65."),
    q("Find the missing term in the series: 120, 99, 80, 63, 48, ?", ["33", "35", "37", "39"], 1, "The differences shrink by 2 each time (−21, −19, −17, −15, −13): 48 − 13 = 35."),
];

// ── 2. Puzzles (10) — 5 from examveda + 5 authored ──
const PUZZLES = [
    q("In a row of trees, one tree is 7th from the left end and 14th from the right end. How many trees are there in the row?", ["18", "19", "20", "21"], 2, "Total = 7 + 14 − 1 = 20 (the tree is counted once in both)."),
    q("In a row of 25 people all facing north, Amit is 9th from the left end. What is his position from the right end?", ["16", "17", "18", "19"], 1, "Position from right = 25 − 9 + 1 = 17."),
    q("Ramesh ranks 13th in a class of 33 students. There are 5 students below Suresh in rank. How many students are there between Ramesh and Suresh?", ["12", "14", "15", "16"], 1, "Suresh is 33 − 5 = 28th; students between the 13th and 28th = 28 − 13 − 1 = 14."),
    q("If MANGO is written as OCPIQ (each letter moved two ahead), how is APPLE written in the same code?", ["CRRNG", "CQPNG", "CRRMG", "BRRNG"], 0, "Move each letter two places forward: A→C, P→R, P→R, L→N, E→G = CRRNG."),
    q("If Football is called Cricket, Cricket is called Basketball, Basketball is called Badminton, Badminton is called Volleyball, Volleyball is called Hockey and Hockey is called Golf, then which of these is NOT played with a ball?", ["Volleyball", "Basketball", "Hockey", "Cricket"], 0, "Badminton is played with a shuttlecock, not a ball, and Badminton is called 'Volleyball' in this code."),
    q("How many times do the hour hand and the minute hand of a clock overlap in a 24-hour day?", ["22", "24", "23", "20"], 0, "The hands coincide 11 times in every 12 hours, so 22 times in 24 hours."),
    q("Each vowel of the word GLADIOLUS is replaced by the next letter of the alphabet and each consonant by the preceding letter. How many vowels are there in the new word?", ["One", "Two", "Three", "No vowel"], 3, "G→F, L→K, A→B, D→C, I→J, O→P, L→K, U→V, S→R gives FKBCJPKVR, no vowels."),
    q("Shan is 55 years old. Sthian is 5 years younger than Shan and 6 years older than Balan. Devan, the youngest brother of Balan, is 7 years younger than Balan. What is the age difference between Devan and Shan?", ["15 years", "18 years", "13 years", "7 years"], 1, "Sthian = 50, Balan = 44, Devan = 37; so 55 − 37 = 18 years."),
    q("Arrange the digits of the number 74853 in ascending order. Which digit is third from the left in the new arrangement?", ["4", "5", "7", "8"], 1, "Ascending order is 3, 4, 5, 7, 8; the third from the left is 5."),
    q("In a family, the father is 30 years older than his son. If the son is 15 years old now, how old will the father be after 5 years?", ["45", "48", "50", "55"], 2, "Father is now 15 + 30 = 45; after 5 years he will be 50."),
];

// ── 3. Statement & Assumption (10, examveda) ──
const STATEMENT_ASSUMPTION = [
    assumption("You are hereby appointed as a programmer with a probation period of one year and your performance will be reviewed at the end of the period for confirmation.", "The performance of an individual generally is not known at the time of the appointment offer.", "Generally an individual tries to prove his worth in the probation period.", 4, "Both are implicit, that is why a probation and a review are built into the appointment."),
    assumption("It is desirable to put the child in school at the age of 5 or so.", "At that age the child reaches an appropriate level of development and is ready to learn.", "The schools do not admit children after six years of age.", 0, "Only I, the recommendation rests on the child's readiness; II is not implied."),
    assumption("In order to bring punctuality to our office, we must provide a conveyance allowance to our employees.", "A conveyance allowance will not help in bringing punctuality.", "Discipline and reward should always go hand in hand.", 1, "Only II, the statement links a reward (allowance) to desired behaviour (punctuality); I contradicts the statement."),
    assumption("An unemployment allowance should be given to all unemployed Indian youth above 18 years of age.", "There are unemployed youth in India who need monetary support.", "The government has sufficient funds to provide the allowance to all unemployed youth.", 0, "Only I, the need is assumed; the availability of funds (II) is not."),
    assumption("If you trouble me, I will slap you., a mother warns her child.", "With the warning, the child may stop troubling her.", "All children are basically naughty.", 0, "Only I, a warning is given in the hope it will work; II is a sweeping generalisation, not assumed."),
    assumption("The State government has decided to appoint four thousand primary school teachers during the next financial year.", "There are enough schools in the state to accommodate four thousand additional primary school teachers.", "The eligible candidates may not be interested to apply as the government may not finally appoint such a large number.", 0, "Only I, a plan to appoint assumes there are posts to fill; II is a negative speculation."),
    assumption("To stop the train, pull the chain. Penalty for improper use, Rs. 500., a notice in a train compartment.", "Some people misuse the alarm chain.", "On certain occasions, people may want to stop a running train.", 4, "Both, the facility exists because people may need to stop the train (II), and the penalty exists because some misuse it (I)."),
    assumption("If it is easy to become an engineer, I don't want to be an engineer.", "An individual aspires to be a professional.", "One desires to achieve a thing that is hard-earned.", 1, "Only II, the speaker values things that are difficult to achieve; I is not implied."),
    assumption("The concession in rail fares for journeys to hill stations has been cancelled because it is not needed by people who can spend their holidays there.", "Railways should give a concession only to needy persons.", "Railways should not encourage people to spend their holidays at hill stations.", 0, "Only I, the reasoning is that the concession should target the needy; II is not implied."),
    assumption("The bridge was built at a cost of Rs. 128 crore and even the civil bus service is not using it, what a pity to see it grossly underutilised.", "The building of such bridges does not serve any public objective.", "There has to be some accountability and utility for money spent on public projects.", 1, "Only II, the regret assumes public money should be put to good use; I is too extreme."),
];

// ── 4. Statement & Argument (10, examveda) ──
const STATEMENT_ARGUMENT = [
    argument("Should the number of holidays of government employees be reduced?", "Yes, our government employees have the maximum number of holidays among the countries of the world.", "Yes, it will lead to increased productivity of government offices.", 1, "Only II is strong, it links the action directly to a concrete benefit; I is merely comparative."),
    argument("Should there be a complete ban on the manufacture of fire-crackers in India?", "No, this will render thousands of workers jobless.", "Yes, the fire-cracker manufacturers use child labour to a large extent.", 0, "Only I is strong, the livelihood impact is a real consequence; II can be tackled without a complete ban."),
    argument("Should election expenses for Central and State legislatures be met by the government?", "Yes, it will put an end to political corruption.", "No, it is not done in any country.", 0, "Only I is strong, it points to a substantial benefit; 'not done elsewhere' is not a strong reason."),
    argument("Should the retirement age for academicians be raised to 65 years?", "No, this will be unfair to non-academicians who have a lower retirement age.", "Yes, experienced academicians can greatly contribute to the nation's intellectual property.", 0, "Only I is strong, fairness across employees is a weighty concern here."),
    argument("Should educated people work in villages?", "Yes, because they can revolutionise agriculture and revamp the rural atmosphere.", "No, the educated should be employed in cities only, otherwise their education will go waste.", 0, "Only I is strong, it shows a real benefit; II is a weak assertion."),
    argument("Should all foreign investment be concentrated only in a few States?", "No, this goes against the all-round economic development of the country.", "Yes, as most States do not have the infrastructure to attract foreign investment.", 1, "Only II is strong, it gives a practical reason for concentration; I states a principle without weighing feasibility."),
    argument("Should there be only one rate of interest for term deposits of varying durations in banks?", "No, people will refrain from keeping money for a longer duration, reducing banks' liquidity.", "Yes, this will be simpler for common people and may encourage them to keep more money in banks.", 0, "Only I is strong, it identifies a serious consequence for banks; II is a weak convenience argument."),
    argument("Should the sex-determination test during pregnancy be completely banned?", "Yes, this leads to indiscriminate female foeticide and will eventually cause a social imbalance.", "No, people have a right to know about their unborn child.", 0, "Only I is strong, preventing a grave social harm outweighs the claimed right in II."),
    argument("Should the government close down loss-making public-sector enterprises?", "No, all the employees will lose their jobs, security and earnings.", "Yes, in a competitive world the rule is survival of the fittest.", 0, "Only I is strong, it points to a concrete human cost; II is a vague slogan."),
    argument("Should all criminals convicted of murder be awarded capital punishment?", "Yes, this will be a significant step towards reducing cases of murder in future.", "No, nobody has the right to take a person's life, whatever their acts.", 0, "Only I is strong, it argues from a concrete deterrent effect."),
];

// ── 5. Statement & Conclusion (10, examveda) ──
const STATEMENT_CONCLUSION = [
    conclusion("If you are a good artist, then we definitely have a job for you.", "You are a good artist.", "We are in need of a good artist.", 1, "Only II follows, offering a job to good artists implies a need; nothing says the listener is a good artist."),
    conclusion("Any young man who makes dowry a condition for marriage discredits himself and dishonours womanhood.", "Those who take dowry in marriage should be condemned by society.", "Those who do not take dowry in marriage respect womanhood.", 4, "Both follow, the statement condemns dowry-takers and, by contrast, credits those who refuse it."),
    conclusion("Nowadays, the sale of television sets of company X has increased.", "The sale of television sets of other companies has decreased.", "The sale of television sets of company X was nil in the past.", 3, "Neither follows, a rise for X says nothing about rivals, nor that past sales were zero."),
    conclusion("The cabinet of State X took steps to tackle the milk glut, as the cooperative and government dairies failed to use the available milk.", "The milk production of State X is more than its need.", "The government and cooperative dairies in State X are not equipped to handle such excess milk.", 4, "Both follow, a 'glut' means surplus (I), and the dairies' failure to use it implies they were not equipped (II)."),
    conclusion("Women's organisations in India have welcomed the amendment of the Industrial Employment Rules 1946 to curb sexual harassment at the workplace.", "Sexual harassment of women at the workplace is more prevalent in India than in other developed countries.", "Many organisations in India will stop recruiting women to avoid such problems.", 3, "Neither follows, the statement neither compares countries nor predicts recruitment behaviour."),
    conclusion("India's economy depends mainly on forests.", "Trees should be preserved to improve the Indian economy.", "India wants only the maintenance of forests to improve economic conditions.", 0, "Only I follows, if the economy depends on forests, preserving trees helps; 'only' in II is too strong."),
    conclusion("Reading maketh a full man, conference a ready man, and writing an exact man.", "Pointed and precise expression comes only through extensive writing.", "Extensive reading makes a complete man.", 4, "Both follow, writing making an 'exact' man supports I, and reading making a 'full' man supports II."),
    conclusion("Modern man influences his destiny by the choices he makes, unlike in the past.", "Earlier, there were fewer options available to man.", "There was no desire in the past to influence destiny.", 0, "Only I follows, 'unlike in the past' implies fewer choices earlier; II ('no desire') is not implied."),
    conclusion("Most of the Indian States existed before independence.", "Some Indian States existed before independence.", "Some Indian States did not exist before independence.", 0, "Only I follows, 'most' guarantees 'some existed'; it does not guarantee that some did not exist (all could have existed)."),
    conclusion("Books without knowledge of life are useless.", "All books contain knowledge of life.", "People should try to gain knowledge of life.", 3, "Neither follows, the statement neither claims all books have such knowledge nor advises people to gain it."),
];

// ── 6. Verbal Reasoning (25, authored) — a general mix ──
const VERBAL_REASONING = [
    q("In a certain code language, CAT is written as DBU. How is DOG written in the same code?", ["EPH", "EPI", "FPH", "EQH"], 0, "Each letter moves one place forward: D→E, O→P, G→H = EPH."),
    q("If FRIEND is coded as HTKGPF, how is CANDLE coded in the same language?", ["ECPFNG", "EDPFNG", "ECPGNG", "ECQFNG"], 0, "Each letter moves two places forward: C→E, A→C, N→P, D→F, L→N, E→G = ECPFNG."),
    q("If MADRAS is written as NBESBT, how is BOMBAY written in the same code?", ["CPNCBZ", "CPNCBY", "CQNCBZ", "CPMCBZ"], 0, "Each letter moves one place forward: B→C, O→P, M→N, B→C, A→B, Y→Z = CPNCBZ."),
    q("In a code, '253' means 'books are old', '546' means 'man is old' and '378' means 'buy good books'. What is the code for 'are'?", ["2", "3", "5", "4"], 0, "'old' is common to 253 and 546 → 5; 'books' is common to 253 and 378 → 3; so in 253 the remaining digit 2 stands for 'are'."),
    q("If EARTH is coded as FBSUI, what is the code for HEART?", ["IFBSU", "IFBTU", "IGBSU", "IFBSV"], 0, "Each letter moves one place forward: H→I, E→F, A→B, R→S, T→U = IFBSU."),
    q("A man walks 5 km towards the North, turns right and walks 3 km, then turns right and walks 5 km. How far is he from the starting point?", ["3 km", "5 km", "8 km", "13 km"], 0, "The 5 km North and 5 km South cancel out, leaving only 3 km to the East."),
    q("A man walks 10 m towards the South, turns left and walks 10 m, then turns left and walks 10 m. Which direction is he facing now?", ["North", "South", "East", "West"], 0, "Facing South, a left turn faces East; another left turn faces North."),
    q("Rahul walks 4 km towards the East and then 3 km towards the North. How far is he from the starting point (in a straight line)?", ["5 km", "7 km", "1 km", "12 km"], 0, "By the right-angle rule, distance = √(4² + 3²) = √25 = 5 km."),
    q("Facing East, a person turns 90° clockwise, then 180°, then 90° anticlockwise. Which direction is the person facing now?", ["West", "East", "North", "South"], 0, "East →(90° CW) South →(180°) North →(90° ACW) West."),
    q("In a row of 40 children, Ravi is 12th from the left end. What is his position from the right end?", ["28", "29", "30", "31"], 1, "Position from right = 40 − 12 + 1 = 29."),
    q("In a class, Sita is 7th from the top and 18th from the bottom in a merit list. How many students are there in the class?", ["23", "24", "25", "26"], 1, "Total = 7 + 18 − 1 = 24."),
    q("Five friends are of different heights. A is taller than B but shorter than C. D is the tallest of all, and E is shorter than B. Who is the shortest?", ["E", "B", "A", "C"], 0, "Order (tall→short): D, C, A, B, E, so E is the shortest."),
    q("P is heavier than Q but lighter than R. S is heavier than R. Who is the heaviest?", ["S", "R", "P", "Q"], 0, "S > R > P > Q, so S is the heaviest."),
    q("Find the next term in the series: 1, 1, 2, 3, 5, 8, ?", ["11", "12", "13", "15"], 2, "Each term is the sum of the previous two (Fibonacci): 5 + 8 = 13."),
    q("Find the odd one out: 3, 5, 9, 11.", ["3", "5", "9", "11"], 2, "All except 9 are prime numbers; 9 = 3 × 3."),
    q("Complete the series: AZ, BY, CX, ?", ["DW", "DV", "EW", "DX"], 0, "First letters go A, B, C, D; second letters go Z, Y, X, W, so DW."),
    q("Find the next term in the series: 2, 6, 12, 20, 30, ?", ["40", "42", "44", "46"], 1, "The terms are 1×2, 2×3, 3×4, 4×5, 5×6, so next is 6×7 = 42."),
    q("Pen is to Write as Knife is to ?", ["Cut", "Sharp", "Kitchen", "Metal"], 0, "A pen is used to write; a knife is used to cut."),
    q("Doctor is to Hospital as Teacher is to ?", ["School", "Student", "Books", "Class"], 0, "A doctor works in a hospital; a teacher works in a school."),
    q("Bird is to Nest as Bee is to ?", ["Hive", "Honey", "Flower", "Sting"], 0, "A bird lives in a nest; a bee lives in a hive."),
    q("If 5 : 24 :: 8 : ?, find the missing number.", ["63", "64", "65", "62"], 0, "The rule is n² − 1: 5² − 1 = 24 and 8² − 1 = 63."),
    q("All the students in Priya's class passed the exam. Rohan is a student in Priya's class. Which of the following must be true?", ["Rohan passed the exam", "Rohan topped the exam", "Priya failed the exam", "Everyone in the school passed"], 0, "If every student in the class passed and Rohan is in the class, Rohan must have passed."),
    q("Ten new TV shows started in a season: 5 comedies, 3 dramas and 2 news shows. By the year's end only 7 were still running, and all 5 comedies were among them. Which of the following must be true?", ["At least one cancelled show was a drama", "All the dramas were cancelled", "All the news shows survived", "Viewers prefer comedies"], 0, "Three shows were cancelled from the 3 dramas + 2 news shows; since only 2 were news shows, at least one cancelled show was a drama."),
    q("Every book on the top shelf is a novel. The red book is on the top shelf. Which of the following must be true?", ["The red book is a novel", "All novels are red", "The shelf holds only red books", "The red book is thick"], 0, "If every book on that shelf is a novel and the red book is on it, the red book must be a novel."),
    q("Erin's parents refuse her request for a dog, saying a dog would not be happy in their small apartment, and offer her a bird instead. Which of the following must be true?", ["Erin and her parents live in an apartment", "Erin dislikes birds", "Erin's parents dislike all pets", "Erin's family plans to move"], 0, "The parents' reason, that a dog would not be happy in their apartment, states that they live in an apartment."),
];

// ── 7. Blood Relations (25) — 10 examveda + 15 authored, deliberately shuffled ──
const BLOOD_RELATIONS = [
    q("Pointing to a man, a woman said, 'He is the son of my grandfather's only son.' How is the man related to the woman?", ["Brother", "Father", "Uncle", "Cousin"], 0, "The grandfather's only son is the woman's father; his son is therefore her brother."),
    q("Pointing at a photograph, Dinesh said, 'His father is the only son of my mother.' Whose photograph is it?", ["Dinesh himself", "Dinesh's brother", "Dinesh's father", "Dinesh's son"], 3, "The only son of Dinesh's mother is Dinesh himself, so the person's father is Dinesh, the photo is of his son."),
    q("X is the brother of Y. Z is the father of X. W is the brother of Z. How is W related to Y?", ["Uncle", "Father", "Brother", "Grandfather"], 0, "Z is the father of X and Y; W is Z's brother, so W is Y's uncle."),
    q("A and B are brothers. C and D are sisters. A's son is D's brother. How is B related to C?", ["Father", "Brother", "Uncle", "Grandfather"], 2, "A's son is D's brother, so C and D are A's daughters; B, being A's brother, is their uncle."),
    q("Introducing a boy, Neha said, 'His mother is the only daughter of my father.' How is Neha related to the boy?", ["Mother", "Sister", "Aunt", "Grandmother"], 0, "The only daughter of Neha's father is Neha herself, so she is the boy's mother."),
    q("Introducing a lady, a man said, 'Her mother is the only daughter of my mother-in-law.' How is the man related to the lady?", ["Son", "Father", "Uncle", "Husband"], 1, "The only daughter of the man's mother-in-law is his own wife; so the lady's mother is his wife, making him her father."),
    q("A is the father of B. B is the sister of C. C is the son of D. How is A related to D?", ["Husband", "Brother", "Father", "Son"], 0, "A and D are the parents of B and C, so A is the husband of D."),
    q("A man said to a lady, 'The son of your only brother is the brother of my wife.' How is the lady related to the man?", ["Mother", "Sister", "Sister of the man's father-in-law", "Grandmother", "Maternal aunt"], 2, "The man's wife is the daughter of the lady's brother; so the lady is the sister of the man's wife's father, i.e., the sister of his father-in-law."),
    q("A is the son of B. C is the mother of B. D is the son of C. How is D related to A?", ["Uncle", "Father", "Grandfather", "Brother"], 0, "C is the mother of B and D, so D is B's brother and therefore A's uncle."),
    q("An old man's son is my son's uncle. How is the old man related to me?", ["Brother", "Father", "Grandfather", "Uncle"], 1, "My son's uncle is my brother; so the old man's son is my brother, making the old man my father."),
    q("A woman introduced a man as 'the son of the brother of my mother.' How is the man related to the woman?", ["Cousin", "Brother", "Nephew", "Uncle"], 0, "Her mother's brother is her maternal uncle; his son is her cousin."),
    q("A is the son of C, while C and Q are sisters. Z is the mother of Q. If P is the son of Z, how is P related to A?", ["Grandfather", "Maternal uncle", "Cousin", "Brother"], 1, "Z is the mother of C and Q, and P is Z's son, so P is C's brother; A is C's son, making P his maternal uncle."),
    q("P is the husband of Q. R is the mother of Q. S is the son of R. How is P related to S?", ["Brother-in-law", "Brother", "Son-in-law", "Uncle"], 0, "R is the mother of Q and S, so S is Q's brother; P, Q's husband, is S's brother-in-law."),
    q("Looking at a portrait, Sanjay said, 'His mother is the wife of my father's son. I have no brothers or sisters.' Whose portrait was Sanjay looking at?", ["His son", "His nephew", "His cousin", "His uncle"], 0, "Having no siblings, 'my father's son' is Sanjay himself; the person's mother is Sanjay's wife, so the portrait is of his son."),
    q("Pointing to a photograph, a man said, 'She is the daughter of my mother's only son.' How is the girl related to the man?", ["Daughter", "Sister", "Niece", "Cousin"], 0, "The man's mother's only son is the man himself, so the girl is his daughter."),
    q("Leela, who is Sohan's daughter, says to Latika, 'Your mother Alka is the younger sister of my father, who is the third child of Gajanan.' How is Gajanan related to Latika?", ["Father", "Uncle", "Grandfather", "Father-in-law"], 2, "Alka (Latika's mother) and Sohan are both children of Gajanan, so Gajanan is Latika's grandfather."),
    q("Pointing to a man in a photograph, a woman said, 'His brother's father is the only son of my grandfather.' How is the woman related to the man?", ["Sister", "Mother", "Aunt", "Cousin"], 0, "The man's father is the only son of the woman's grandfather, i.e., the woman's own father; so the woman is the man's sister."),
    q("A is the brother of B and K. D is the mother of B, and E is the father of A. Which of the following is NOT definitely true?", ["B is the brother of K", "A is the father of K", "A is the son of D", "D is the wife of E"], 1, "A is K's brother, so A cannot be K's father, that statement is not true."),
    q("P is the mother of Q. Q is the brother of R. R is the daughter of S. How is P related to S?", ["Wife", "Sister", "Mother", "Daughter"], 0, "P and S are the parents of Q and R, so P is the wife of S."),
    q("Introducing a woman, a man said, 'Her mother's husband's sister is my aunt.' How is the man related to the woman?", ["Nephew", "Brother", "Brother-in-law", "Cousin"], 1, "The woman's father's sister is the man's aunt, so they share the same father, the man is her brother."),
    q("Ravi said, 'This girl is the wife of the grandson of my mother.' How is Ravi related to the girl?", ["Father-in-law", "Father", "Grandfather", "Uncle"], 0, "The grandson of Ravi's mother is Ravi's son; the girl is his son's wife, so Ravi is her father-in-law."),
    q("Pointing to a lady, Raj said, 'Her son's father is the only son-in-law of my mother.' How is the lady related to Raj?", ["Sister", "Mother", "Wife", "Aunt"], 0, "The lady's husband is the only son-in-law of Raj's mother, so the lady is the daughter of Raj's mother, his sister."),
    q("P is the son of Q. Q is the daughter of R. R is the mother of S, who is a male. How is S related to P?", ["Maternal uncle", "Father", "Brother", "Grandfather"], 0, "R is the mother of Q and S, so S is Q's brother; P is Q's son, making S his maternal uncle."),
    q("In a code, 'M + N' means 'M is the brother of N', 'M × N' means 'M is the father of N', and 'M − N' means 'M is the sister of N'. Which expression shows that P is the uncle of Q?", ["P + R × Q", "P × R + Q", "P − R × Q", "P + R − Q"], 0, "'P + R' makes P the brother of R, and 'R × Q' makes R the father of Q; so P is the brother of Q's father, Q's uncle."),
    q("Rekha is the daughter of Ramesh. Ramesh's wife is Sudha. Sudha's brother is Ravi. How is Ravi related to Rekha?", ["Maternal uncle", "Father", "Brother", "Grandfather"], 0, "Sudha is Rekha's mother; Ravi is Sudha's brother, so he is Rekha's maternal uncle."),
];

// ── 8. Data Sufficiency (10) — 5 examveda + 5 authored, mixed ──
const DATA_SUFFICIENCY = [
    ds("In which year was Rahul born?", "Rahul is at present 25 years younger than his mother.", "Rahul's brother, who was born in 1964, is 35 years younger than their mother.", 4, "II fixes the mother's birth year as 1929; I then gives Rahul's as 1954, both are needed."),
    ds("What is the value of x?", "3x + 5 = 20.", "x is a positive integer less than 10.", 0, "I gives 3x = 15, so x = 5; II alone allows many values."),
    ds("How many children does M have?", "H is the only daughter of X, who is the wife of M.", "K and J are brothers of M.", 3, "I mentions only one daughter (not the total), and II concerns M's brothers, neither gives the number of children."),
    ds("What is the cost of one pen?", "Five pens cost Rs. 50.", "Two pens and one pencil cost Rs. 25, and one pencil costs Rs. 5.", 2, "Each statement alone gives the cost of one pen as Rs. 10."),
    ds("What is the total weight of 10 poles, each of the same weight?", "One-fourth of the weight of each pole is 5 kg.", "The total weight of three poles is 20 kg more than the total weight of two poles.", 2, "I gives each pole as 20 kg; II gives one pole as 20 kg, either yields a total of 200 kg."),
    ds("What is the two-digit number?", "The sum of its two digits is 9.", "The difference between the number and the number formed by reversing its digits is 27.", 4, "I gives digits summing to 9; II gives (tens − units) = 3; together the number is 63, both are needed."),
    ds("The last Sunday of March 2006 fell on which date?", "The first Sunday of that month fell on the 5th.", "The last day of that month was a Friday.", 2, "Either statement independently fixes the last Sunday as the 26th."),
    ds("What is Meena's rank from the top in her class?", "Meena is 5th from the top.", "There are 30 students in the class.", 0, "I states her rank directly; the class size in II is not needed."),
    ds("What were the total sales of the company?", "The company sold 8,000 units of product A, each costing Rs. 25.", "The company has no other product line.", 4, "I gives product A's sales; II confirms there is nothing else, both are needed for the total."),
    ds("In a code language, what is the code for the word 'rain'?", "'rain is coming' is written as 'ta pe la'.", "'heavy rain today' is written as 'ta ni ma'.", 4, "'rain' is the only word common to both sentences and 'ta' the only common code, so both are needed to pin it down."),
];

// ── 9. Syllogisms (10) — 5 examveda + 5 authored, mixed ──
const SYLLOGISMS = [
    syllogism("Some poets are poems. No poem is a song.", "Some poems are not songs.", "Some songs are poems.", 0, "'No poem is a song' makes I true and rules out II."),
    syllogism("All cats are animals. All animals are living things.", "All cats are living things.", "Some living things are cats.", 4, "Cats ⊆ animals ⊆ living things gives I; and since cats exist, some living things are cats (II)."),
    syllogism("Some kings are queens. All queens are beautiful.", "All kings are beautiful.", "All queens are kings.", 3, "Only some kings are queens, so neither 'all kings are beautiful' nor 'all queens are kings' follows."),
    syllogism("All keys are locks. Some locks are red.", "Some keys are red.", "Some keys are not red.", 2, "Neither is certain individually, but a key must be either red or not, so either I or II follows."),
    syllogism("All harmoniums are instruments. All instruments are flutes.", "All flutes are instruments.", "All harmoniums are flutes.", 1, "Harmoniums ⊆ instruments ⊆ flutes gives II; 'all flutes are instruments' reverses a statement and does not follow."),
    syllogism("All doctors are graduates. All graduates are educated.", "All doctors are educated.", "All educated people are doctors.", 0, "The chain gives I; II wrongly reverses the statements."),
    syllogism("Some hens are cows. All cows are horses.", "Some horses are hens.", "Some hens are horses.", 4, "The hens that are cows are also horses, so both conclusions follow."),
    syllogism("All roses are flowers. Some flowers are red.", "Some roses are red.", "Some red things are flowers.", 1, "The red flowers need not be roses, so I does not follow; II simply reverses 'some flowers are red'."),
    syllogism("All poets are goats. Some goats are trees.", "Some poets are trees.", "Some trees are goats.", 1, "The goats that are trees need not be poets, so I fails; II reverses 'some goats are trees'."),
    syllogism("Some tables are chairs. All chairs are wooden.", "Some tables are wooden.", "All wooden things are chairs.", 0, "The tables that are chairs are wooden, giving I; II wrongly reverses 'all chairs are wooden'."),
];

const TESTS = [
    { slug: "missing-number", topic: "Missing Number", title: "Reasoning: Missing Number, Practice", format: "practice", mode: "practice", difficulty: "moderate", questions: MISSING_NUMBER, blurb: "25 number-series and matrix puzzles to sharpen your 'find the missing number' speed. Practice mode, the answer and a short reason appear as soon as you pick, and you can retake it any time." },
    { slug: "puzzles", topic: "Puzzles", title: "Reasoning: Puzzles, Quick Shot", format: "quick-shot", mode: "practice", difficulty: "moderate", questions: PUZZLES, blurb: "10 mixed logical puzzles, rows, rankings, ages, clocks and coding. Practice mode: answers reveal as you go." },
    { slug: "statement-assumption", topic: "Statement & Assumption", title: "Reasoning: Statement & Assumption", format: "quick-shot", mode: "practice", difficulty: "moderate", questions: STATEMENT_ASSUMPTION, blurb: "10 statement-and-assumption questions with the standard five-way choice. Practice mode with instant reasoning." },
    { slug: "statement-argument", topic: "Statement & Argument", title: "Reasoning: Statement & Argument", format: "quick-shot", mode: "practice", difficulty: "moderate", questions: STATEMENT_ARGUMENT, blurb: "10 statement-and-argument questions, decide which argument is strong. Practice mode with instant explanations." },
    { slug: "statement-conclusion", topic: "Statement & Conclusion", title: "Reasoning: Statement & Conclusion", format: "quick-shot", mode: "practice", difficulty: "moderate", questions: STATEMENT_CONCLUSION, blurb: "10 statement-and-conclusion questions, decide which conclusion follows. Practice mode with instant explanations." },
    { slug: "verbal-reasoning", topic: "Verbal Reasoning", title: "Reasoning: Verbal Reasoning, Practice", format: "practice", mode: "practice", difficulty: "moderate", questions: VERBAL_REASONING, blurb: "25 mixed verbal-reasoning questions, coding, directions, series, ranking, analogies and logical deduction. Practice mode, retake any time." },
    { slug: "blood-relations", topic: "Blood Relations", title: "Reasoning: Blood Relations", format: "practice", mode: "test", difficulty: "moderate", questions: BLOOD_RELATIONS, blurb: "25 blood-relation puzzles, graded like the real exam. One attempt, see where you rank on the live leaderboard right after." },
    { slug: "data-sufficiency", topic: "Data Sufficiency", title: "Reasoning: Data Sufficiency", format: "quick-shot", mode: "test", difficulty: "moderate", questions: DATA_SUFFICIENCY, blurb: "10 data-sufficiency questions, decide which statements are enough to answer. Graded, one attempt, live leaderboard." },
    { slug: "syllogisms", topic: "Syllogisms", title: "Reasoning: Syllogisms", format: "quick-shot", mode: "test", difficulty: "moderate", questions: SYLLOGISMS, blurb: "10 syllogism questions, decide which conclusions logically follow. Graded, one attempt, live leaderboard." },
];

// Publish each topic set once (per-test SeedFlag), attributed to an admin.
async function ensureReasoningTopicTestsSeeded() {
    try {
        const owner =
            (await User.findOne({ role: { $in: ["superadmin", "admin"] } }).sort({ createdAt: 1 }).select("_id").lean()) ||
            (await User.findOne().sort({ createdAt: 1 }).select("_id").lean());
        if (!owner) {
            console.warn("[reasoning-topics] no user to attribute yet; will publish on a later boot");
            return;
        }

        for (const t of TESTS) {
            const key = `reasoning-topic-${t.slug}-v1`;
            if (await SeedFlag.exists({ key })) continue;

            const need = TEST_FORMATS[t.format].count;
            if (t.questions.length !== need) {
                console.warn(`[reasoning-topics] ${t.topic} has ${t.questions.length} questions, expected ${need}, skipped`);
                continue;
            }

            const docs = await Question.insertMany(
                t.questions.map((qq) => ({
                    text: qq.text,
                    options: [...qq.options],
                    correctIndex: qq.correctIndex,
                    explanation: qq.explanation,
                    subject: "Reasoning",
                    topic: t.topic,
                    difficulty: t.difficulty,
                    marks: 1,
                    createdBy: owner._id,
                }))
            );
            await Test.create({
                title: t.title,
                description: t.blurb,
                subject: "Reasoning",
                category: "topic-wise",
                format: t.format,
                mode: t.mode,
                durationMinutes: need,
                targets: [],
                questions: docs.map((d) => d._id),
                totalMarks: docs.length,
                status: "published",
                isPublished: true,
                createdBy: owner._id,
            });
            await SeedFlag.create({ key });
            console.log(`[reasoning-topics] published ${t.title} (${docs.length} Q, ${t.mode})`);
        }
    } catch (e) {
        console.warn("[reasoning-topics] seed skipped:", e.message);
    }
}

module.exports = {
    MISSING_NUMBER,
    PUZZLES,
    STATEMENT_ASSUMPTION,
    STATEMENT_ARGUMENT,
    STATEMENT_CONCLUSION,
    VERBAL_REASONING,
    BLOOD_RELATIONS,
    DATA_SUFFICIENCY,
    SYLLOGISMS,
    TESTS,
    ensureReasoningTopicTestsSeeded,
};


