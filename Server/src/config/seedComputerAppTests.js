const Test = require("../models/testModel");
const Question = require("../models/questionModel");
const User = require("../models/userModel");
const SeedFlag = require("../models/seedFlagModel");
const { TEST_FORMATS } = require("./testFormats");

// Computer Application (Computer Awareness) for the LEET exam — four chapters,
// each in BOTH flavours:
//   • Practice (repeatable, answer + reason reveal as you go)
//   • Graded Test (single-attempt, ranked on a live leaderboard)
// The two flavours of a chapter use DIFFERENT questions. 80 freshly authored,
// exam-focused fundamentals questions. Quick Shot (10 Q), 25-minute window,
// subject "Computer Application" with a per-chapter topic, open to all exams.

const q = (text, options, correctIndex, explanation) => ({ text, options, correctIndex, explanation });

/* ─────────────── COMPUTER FUNDAMENTALS ─────────────── */
const FUND_PRACTICE = [
    q("The part of a computer often called its 'brain' is the:", ["Monitor", "CPU", "RAM", "Keyboard"], 1, "The CPU (Central Processing Unit) executes instructions and is called the brain of the computer."),
    q("CPU stands for:", ["Central Processing Unit", "Computer Personal Unit", "Central Program Unit", "Control Processing Unit"], 0, "CPU = Central Processing Unit."),
    q("RAM is a type of memory that is:", ["non-volatile", "volatile", "permanent", "read-only"], 1, "RAM is volatile — its contents are lost when the power is switched off."),
    q("Which of the following is an input device?", ["Monitor", "Printer", "Keyboard", "Speaker"], 2, "A keyboard feeds data into the computer, so it is an input device."),
    q("Which of the following is an output device?", ["Mouse", "Keyboard", "Scanner", "Monitor"], 3, "A monitor displays output, so it is an output device."),
    q("One byte is equal to:", ["4 bits", "16 bits", "8 bits", "2 bits"], 2, "1 byte = 8 bits."),
    q("The first generation of computers used:", ["Transistors", "Vacuum tubes", "Integrated circuits", "Microprocessors"], 1, "First-generation computers used vacuum tubes."),
    q("ROM stands for:", ["Random Only Memory", "Read Origin Memory", "Rapid Optical Memory", "Read Only Memory"], 3, "ROM = Read Only Memory, a non-volatile memory."),
    q("The physical components of a computer are collectively called:", ["Software", "Firmware", "Hardware", "Malware"], 2, "The tangible parts of a computer are its hardware."),
    q("Which of the following is a pointing device?", ["Keyboard", "Mouse", "Printer", "Monitor"], 1, "A mouse is a pointing device used to move the cursor."),
];
const FUND_TEST = [
    q("Which part of the CPU performs arithmetic and logical operations?", ["ALU", "Control Unit", "RAM", "ROM"], 0, "The Arithmetic Logic Unit (ALU) carries out arithmetic and logical operations."),
    q("ALU stands for:", ["Automatic Logic Unit", "Arithmetic Logic Unit", "Arithmetic Local Unit", "Advanced Logic Unit"], 1, "ALU = Arithmetic Logic Unit."),
    q("Which of the following is a secondary (storage) device?", ["RAM", "CPU", "Hard disk", "ALU"], 2, "A hard disk is secondary storage that retains data without power."),
    q("RAM stands for:", ["Read Access Memory", "Rapid Access Memory", "Random Automatic Memory", "Random Access Memory"], 3, "RAM = Random Access Memory."),
    q("Which generation of computers used transistors?", ["First generation", "Second generation", "Third generation", "Fourth generation"], 1, "Second-generation computers used transistors."),
    q("One kilobyte (KB) is equal to:", ["1000 bytes", "100 bytes", "512 bytes", "1024 bytes"], 3, "1 KB = 1024 bytes (2¹⁰)."),
    q("Which of the following is NOT an input device?", ["Keyboard", "Mouse", "Scanner", "Monitor"], 3, "A monitor is an output device, not an input device."),
    q("The set of programs that tells a computer what to do is called:", ["Software", "Hardware", "Firmware only", "Malware"], 0, "Programs and instructions are collectively called software."),
    q("A printer is an example of a(n):", ["Input device", "Output device", "Storage device", "Processing device"], 1, "A printer produces output on paper, so it is an output device."),
    q("Which memory is non-volatile (retains its contents without power)?", ["RAM", "Cache", "ROM", "Register"], 2, "ROM is non-volatile — it keeps its contents even when the power is off."),
];

/* ─────────────── NUMBER SYSTEMS ─────────────── */
const NUM_PRACTICE = [
    q("The base (radix) of the binary number system is:", ["2", "8", "10", "16"], 0, "The binary system uses base 2."),
    q("The base (radix) of the decimal number system is:", ["2", "8", "16", "10"], 3, "The decimal system uses base 10."),
    q("The digits used in the binary number system are:", ["0 to 9", "0 and 1", "1 and 2", "0 to 7"], 1, "Binary uses only the two digits 0 and 1."),
    q("The decimal equivalent of the binary number 1010 is:", ["8", "12", "5", "10"], 3, "1010₂ = 8 + 0 + 2 + 0 = 10."),
    q("The binary equivalent of the decimal number 5 is:", ["100", "111", "101", "110"], 2, "5 = 4 + 1 = 101₂."),
    q("The base (radix) of the hexadecimal number system is:", ["8", "10", "2", "16"], 3, "The hexadecimal system uses base 16."),
    q("The base (radix) of the octal number system is:", ["2", "8", "16", "10"], 1, "The octal system uses base 8."),
    q("The decimal equivalent of the binary number 111 is:", ["5", "6", "7", "8"], 2, "111₂ = 4 + 2 + 1 = 7."),
    q("One nibble is equal to:", ["2 bits", "4 bits", "8 bits", "16 bits"], 1, "A nibble is 4 bits (half a byte)."),
    q("In the hexadecimal system, the symbol A represents the decimal value:", ["10", "11", "12", "15"], 0, "Hex A = 10 in decimal."),
];
const NUM_TEST = [
    q("The decimal equivalent of the binary number 110 is:", ["4", "6", "5", "3"], 1, "110₂ = 4 + 2 + 0 = 6."),
    q("The decimal equivalent of the binary number 1100 is:", ["10", "14", "8", "12"], 3, "1100₂ = 8 + 4 = 12."),
    q("The binary equivalent of the decimal number 8 is:", ["1000", "100", "1010", "110"], 0, "8 = 1000₂."),
    q("The number of distinct symbols in the hexadecimal system is:", ["8", "10", "16", "6"], 2, "Hexadecimal has 16 symbols: 0–9 and A–F."),
    q("The decimal equivalent of the binary number 10000 is:", ["8", "32", "10", "16"], 3, "10000₂ = 2⁴ = 16."),
    q("The decimal equivalent of the hexadecimal number 10 is:", ["10", "16", "8", "15"], 1, "10₁₆ = 1 × 16 + 0 = 16."),
    q("In the hexadecimal system, the symbol F represents the decimal value:", ["15", "14", "16", "10"], 0, "Hex F = 15 in decimal."),
    q("The binary equivalent of the decimal number 2 is:", ["1", "11", "10", "100"], 2, "2 = 10₂."),
    q("How many bits are there in 2 bytes?", ["8 bits", "12 bits", "32 bits", "16 bits"], 3, "1 byte = 8 bits, so 2 bytes = 16 bits."),
    q("The largest digit in the octal number system is:", ["8", "7", "9", "1"], 1, "Octal digits are 0–7, so the largest is 7."),
];

/* ─────────────── SOFTWARE & OPERATING SYSTEMS ─────────────── */
const SOFT_PRACTICE = [
    q("Software is broadly classified into application software and:", ["system software", "hardware", "firmware", "malware"], 0, "The two broad classes are system software and application software."),
    q("An example of system software is:", ["MS Word", "the operating system", "MS Excel", "Google Chrome"], 1, "The operating system is system software."),
    q("An example of application software is:", ["Windows", "Linux", "MS Word", "BIOS"], 2, "MS Word is application software (a word processor)."),
    q("An operating system is a type of:", ["system software", "application software", "utility hardware", "malware"], 0, "The OS is system software that manages the computer."),
    q("Windows is an example of a(n):", ["word processor", "spreadsheet", "browser", "operating system"], 3, "Windows is an operating system."),
    q("A compiler converts a program from:", ["machine code to high-level", "binary to decimal", "text to image", "high-level language to machine language"], 3, "A compiler translates high-level source code into machine language."),
    q("Machine language is written using:", ["binary (0s and 1s)", "English words", "hexadecimal only", "decimal numbers"], 0, "Machine language is expressed in binary — 0s and 1s."),
    q("Which of the following is an operating system?", ["MS Word", "Linux", "MS Excel", "Google Chrome"], 1, "Linux is an operating system; the others are applications."),
    q("The language that a computer understands directly is:", ["high-level language", "assembly language", "machine language", "English"], 2, "A computer directly understands only machine language."),
    q("MS Excel is used mainly for:", ["presentations", "word processing", "browsing", "spreadsheets"], 3, "MS Excel is a spreadsheet application."),
];
const SOFT_TEST = [
    q("The software that controls the overall operation of a computer is:", ["a word processor", "the operating system", "a spreadsheet", "a web browser"], 1, "The operating system manages and controls the computer."),
    q("A program that translates an entire high-level program at once is a:", ["interpreter", "assembler", "compiler", "loader"], 2, "A compiler translates the whole program in one go."),
    q("A program that translates a high-level program line by line is an:", ["interpreter", "compiler", "linker", "editor"], 0, "An interpreter translates and runs a program one line at a time."),
    q("Which of the following is application software?", ["Windows", "Linux", "BIOS", "MS PowerPoint"], 3, "MS PowerPoint is application software; the others are system software."),
    q("A language written using mnemonics such as ADD and SUB is:", ["assembly language", "machine language", "high-level language", "binary"], 0, "Assembly language uses mnemonics like ADD and SUB."),
    q("A key function of an operating system is to manage:", ["colours", "typing speed", "memory and processes", "the electricity bill"], 2, "The OS manages resources such as memory and processes."),
    q("Which of the following is NOT an operating system?", ["Windows", "Linux", "Android", "MS Word"], 3, "MS Word is an application, not an operating system."),
    q("Before a high-level program can run, it must be converted into:", ["English", "machine language", "hexadecimal", "a flowchart"], 1, "High-level code must be translated into machine language to execute."),
    q("MS PowerPoint is used to create:", ["spreadsheets", "databases", "browsing history", "presentations"], 3, "MS PowerPoint is used to create presentations (slides)."),
    q("When a computer is switched on, the process of loading the operating system is called:", ["booting", "shutting down", "formatting", "scanning"], 0, "Loading the OS at start-up is called booting."),
];

/* ─────────────── NETWORKING & INTERNET ─────────────── */
const NET_PRACTICE = [
    q("LAN stands for:", ["Local Area Network", "Large Area Network", "Long Access Node", "Local Access Network"], 0, "LAN = Local Area Network."),
    q("WAN stands for:", ["Wireless Area Network", "Wide Access Network", "World Area Network", "Wide Area Network"], 3, "WAN = Wide Area Network."),
    q("WWW stands for:", ["World Wide Web", "World Web Wide", "Wide World Web", "Web World Wide"], 0, "WWW = World Wide Web."),
    q("The global network that connects computers all over the world is the:", ["LAN", "intranet", "Internet", "Ethernet"], 2, "The Internet is the worldwide network of computers."),
    q("HTTP stands for:", ["High Transfer Text Protocol", "HyperText Transfer Protocol", "HyperText Transmission Path", "Host Transfer Text Protocol"], 1, "HTTP = HyperText Transfer Protocol."),
    q("Which of the following is a web browser?", ["MS Word", "Google Chrome", "Windows", "MS Excel"], 1, "Google Chrome is a web browser."),
    q("E-mail stands for:", ["Emergency Mail", "Electric Mail", "Extended Mail", "Electronic Mail"], 3, "E-mail = Electronic Mail."),
    q("A network confined to a single building or office is a:", ["WAN", "MAN", "LAN", "the Internet"], 2, "A network within one building/office is a LAN (Local Area Network)."),
    q("The unique address that identifies a computer on a network is its:", ["MAC name", "IP address", "URL", "e-mail"], 1, "An IP address uniquely identifies a device on a network."),
    q("URL stands for:", ["Uniform Resource Locator", "Universal Reference Link", "Uniform Reference Locator", "United Resource Locator"], 0, "URL = Uniform Resource Locator."),
];
const NET_TEST = [
    q("A network that covers a large geographical area, such as a country, is a:", ["LAN", "MAN", "WAN", "PAN"], 2, "A WAN (Wide Area Network) spans large geographical areas."),
    q("FTP stands for:", ["Fast Transfer Protocol", "File Transfer Protocol", "File Transmission Path", "Format Transfer Protocol"], 1, "FTP = File Transfer Protocol, used to transfer files over a network."),
    q("The protocol used to transfer web pages on the Internet is:", ["FTP", "SMTP", "HTTP", "TCP"], 2, "HTTP (HyperText Transfer Protocol) transfers web pages."),
    q("The device that connects a computer to the Internet and routes data between networks is a:", ["monitor", "router", "scanner", "keyboard"], 1, "A router forwards data between networks and connects to the Internet."),
    q("IP (as in IP address) stands for:", ["Internet Program", "Internal Protocol", "Internet Protocol", "Input Protocol"], 2, "IP = Internet Protocol."),
    q("Two or more computers connected together to share data and resources form:", ["a spreadsheet", "a database", "a document", "a computer network"], 3, "Interconnected computers that share resources form a computer network."),
    q("The '@' symbol is used in:", ["file names", "e-mail addresses", "URLs", "passwords"], 1, "The @ symbol separates the user name and domain in an e-mail address."),
    q("A collection of related web pages under one domain is called a:", ["a single webpage", "a website", "a browser", "a server"], 1, "A group of related web pages forms a website."),
    q("ISP stands for:", ["Internet Service Provider", "Internal System Program", "Internet System Protocol", "International Service Provider"], 0, "ISP = Internet Service Provider."),
    q("USB stands for:", ["Universal Serial Bus", "Uniform System Bus", "Universal System Board", "United Serial Bus"], 0, "USB = Universal Serial Bus."),
];

const TESTS = [
    { slug: "fundamentals-practice", topic: "Computer Fundamentals", mode: "practice", difficulty: "easy", title: "Computer Application: Computer Fundamentals — Practice", questions: FUND_PRACTICE, blurb: "10 practice questions on computer fundamentals — CPU, memory, input/output devices, generations and units. Repeatable; the answer reveals as you go. 25-minute window." },
    { slug: "fundamentals-test", topic: "Computer Fundamentals", mode: "test", difficulty: "moderate", title: "Computer Application: Computer Fundamentals — Graded Test", questions: FUND_TEST, blurb: "A single-attempt, graded 10-question test on computer fundamentals, ranked on a live leaderboard. 25 minutes." },
    { slug: "number-systems-practice", topic: "Number Systems", mode: "practice", difficulty: "easy", title: "Computer Application: Number Systems — Practice", questions: NUM_PRACTICE, blurb: "10 practice questions on number systems — binary, decimal, octal and hexadecimal, bases, conversions and units. 25-minute window." },
    { slug: "number-systems-test", topic: "Number Systems", mode: "test", difficulty: "moderate", title: "Computer Application: Number Systems — Graded Test", questions: NUM_TEST, blurb: "A single-attempt, graded 10-question test on number systems, ranked on a live leaderboard. 25 minutes." },
    { slug: "software-practice", topic: "Software & Operating Systems", mode: "practice", difficulty: "easy", title: "Computer Application: Software & Operating Systems — Practice", questions: SOFT_PRACTICE, blurb: "10 practice questions on software — system vs application software, operating systems, compilers/interpreters and languages. 25-minute window." },
    { slug: "software-test", topic: "Software & Operating Systems", mode: "test", difficulty: "moderate", title: "Computer Application: Software & Operating Systems — Graded Test", questions: SOFT_TEST, blurb: "A single-attempt, graded 10-question test on software & operating systems, ranked on a live leaderboard. 25 minutes." },
    { slug: "networking-practice", topic: "Networking & Internet", mode: "practice", difficulty: "easy", title: "Computer Application: Networking & Internet — Practice", questions: NET_PRACTICE, blurb: "10 practice questions on networking & the internet — LAN/WAN, WWW, HTTP, browsers, IP/URL and common abbreviations. 25-minute window." },
    { slug: "networking-test", topic: "Networking & Internet", mode: "test", difficulty: "moderate", title: "Computer Application: Networking & Internet — Graded Test", questions: NET_TEST, blurb: "A single-attempt, graded 10-question test on networking & the internet, ranked on a live leaderboard. 25 minutes." },
];

// Publish each set once (per-test SeedFlag). Practice sets are repeatable; the
// "test" sets are single-attempt & graded (no closeAt = lifetime + live board).
// All Quick Shot (10 Q), 25-minute, subject "Computer Application", all exams.
async function ensureComputerAppTestsSeeded() {
    try {
        const owner =
            (await User.findOne({ role: { $in: ["superadmin", "admin"] } }).sort({ createdAt: 1 }).select("_id").lean()) ||
            (await User.findOne().sort({ createdAt: 1 }).select("_id").lean());
        if (!owner) {
            console.warn("[computer-app] no user to attribute yet; will publish on a later boot");
            return;
        }

        for (const t of TESTS) {
            const key = `computer-app-${t.slug}-v1`;
            if (await SeedFlag.exists({ key })) continue;

            if (t.questions.length !== TEST_FORMATS["quick-shot"].count) {
                console.warn(`[computer-app] ${t.slug} has ${t.questions.length}, expected 10 — skipped`);
                continue;
            }

            const docs = await Question.insertMany(
                t.questions.map((qq) => ({
                    text: qq.text,
                    options: [...qq.options],
                    correctIndex: qq.correctIndex,
                    explanation: qq.explanation,
                    subject: "Computer Application",
                    topic: t.topic,
                    difficulty: t.difficulty,
                    marks: 1,
                    createdBy: owner._id,
                }))
            );
            await Test.create({
                title: t.title,
                description: t.blurb,
                subject: "Computer Application",
                topic: t.topic,
                category: "topic-wise",
                format: "quick-shot",
                mode: t.mode,
                durationMinutes: 25,
                targets: [],
                questions: docs.map((d) => d._id),
                totalMarks: docs.length,
                status: "published",
                isPublished: true,
                createdBy: owner._id,
            });
            await SeedFlag.create({ key });
            console.log(`[computer-app] published ${t.title} (${t.mode}, ${docs.length} Q)`);
        }
    } catch (e) {
        console.warn("[computer-app] seed skipped:", e.message);
    }
}

module.exports = {
    FUND_PRACTICE, FUND_TEST,
    NUM_PRACTICE, NUM_TEST,
    SOFT_PRACTICE, SOFT_TEST,
    NET_PRACTICE, NET_TEST,
    TESTS,
    ensureComputerAppTestsSeeded,
};
