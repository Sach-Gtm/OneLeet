const Syllabus = require("../models/syllabusModel");
const User = require("../models/userModel");
const SeedFlag = require("../models/seedFlagModel");

const SEED_KEY = "ipu-syllabus-v1";

// The official IPU LEET (IPU CET 128) syllabus, cleaned of coaching-ad noise and
// structured subject → chapter → topic. Seeded ONCE (published, targeted to the
// "ipu-leet" exam) so students preparing for IPU LEET have a real syllabus to
// track from day one. After seeding these are ordinary records staff can edit
// or remove from the Content Studio, so we only seed when NO ipu-leet syllabus
// exists yet — editing/removing them won't make the seed reappear.
//
// `hours` is the per-topic study estimate (estimatedHours) for that subject.
const IPU_LEET_SYLLABUS = [
    {
        subject: "Applied Mathematics",
        hours: 1.5,
        chapters: [
            { title: "Calculus", topics: ["Limits and continuity", "Differentiation", "Application of derivatives", "Indefinite integration", "Definite integration", "Application of integration", "Differential equations"] },
            { title: "Linear Algebra", topics: ["Matrix operations: addition, multiplication and inversion", "Determinants and their properties", "Applications of matrices in systems of linear equations", "Vector spaces: basis and dimension", "Linear transformations and their matrix representations", "Inner product spaces and orthogonality"] },
            { title: "Probability", topics: ["Experiments, sample space and events", "Conditional probability and Bayes' theorem", "Random variables: discrete and continuous", "Probability distributions: binomial, Poisson, normal, exponential"] },
            { title: "Sets", topics: ["Types of sets (finite, infinite, universal, null)", "Operations on sets: union, intersection, difference", "Venn diagrams"] },
            { title: "Relations", topics: ["Definition and types of relations (reflexive, symmetric, transitive)", "Representation of relations"] },
            { title: "Functions", topics: ["Types of functions (one-to-one, onto, bijective)", "Function composition", "Inverse functions"] },
            { title: "Trigonometric Functions", topics: ["Trigonometric ratios and the unit circle", "Trigonometric identities (sum/difference, double and half angle)", "Applications: heights and distances, trigonometric equations"] },
            { title: "Complex Numbers", topics: ["Algebra of complex numbers", "Polar form", "De Moivre's theorem"] },
            { title: "Permutations and Combinations", topics: ["Basic counting principles and factorial notation", "Permutations and combinations"] },
            { title: "Binomial Theorem", topics: ["Binomial expansion", "General term and middle term", "Applications"] },
            { title: "Sequences and Series", topics: ["Arithmetic progressions: nth term and sum of n terms", "Geometric progressions: nth term, sum of n terms and infinite GP"] },
            { title: "Co-ordinate Geometry", topics: ["Straight lines: slope, forms of a line, angle between two lines", "Equation of a circle", "Conic sections: parabola, ellipse and hyperbola"] },
        ],
    },
    {
        subject: "Reasoning",
        hours: 0.5,
        chapters: [
            { title: "Verbal Reasoning", topics: ["Number series", "Alphabet series", "Coding-decoding", "Blood relations", "Direction sense test", "Classification", "Statement and assumptions", "Statement and conclusions"] },
            { title: "Non-Verbal Reasoning", topics: ["Figure series", "Analogies in figures", "Classification of figures", "Mirror images", "Embedded figures", "Paper folding", "Cube and dice"] },
        ],
    },
    {
        subject: "Quantitative Aptitude",
        hours: 0.5,
        chapters: [
            { title: "Quantitative Aptitude", topics: ["Number system: types of numbers, LCM and HCF, divisibility rules", "Percentages", "Profit and loss", "Averages: mean, median, mode", "Ratios and proportions", "Time and work", "Speed, distance and time", "Simple and compound interest", "Mensuration: 2D areas and perimeters, 3D volumes and surface areas"] },
        ],
    },
    {
        subject: "Applied Mechanics",
        hours: 1,
        chapters: [
            { title: "Introduction to Mechanics", topics: ["Definition and scope of mechanics", "Types of mechanics: statics, dynamics and kinematics"] },
            { title: "Laws of Force", topics: ["Newton's first law (law of inertia)", "Newton's second law (F = ma)", "Newton's third law (action-reaction)"] },
            { title: "Moment", topics: ["Definition and calculation of moment", "Clockwise and counter-clockwise moments", "Equilibrium of moments"] },
            { title: "Friction", topics: ["Static and kinetic friction", "Laws of friction", "Applications of friction"] },
            { title: "Centre of Gravity", topics: ["Centre of gravity of regular shapes", "Centre of gravity of irregular shapes", "Significance for stability and balance"] },
            { title: "Moment of Inertia", topics: ["Definition and calculation", "Parallel axis theorem", "Applications in rotational motion"] },
            { title: "Laws of Motion", topics: ["Newton's laws of motion in detail", "Impulse and momentum", "Conservation of momentum"] },
            { title: "Simple Lifting Machines", topics: ["Levers and mechanical advantage", "Pulleys: fixed and movable", "Inclined planes"] },
        ],
    },
    {
        subject: "Strength of Material",
        hours: 1,
        chapters: [
            { title: "Stress and Strain", topics: ["Types of stress: tensile, compressive, shear", "Types of strain: normal and shear", "Stress-strain curve"] },
            { title: "Shear Force and Bending Moment", topics: ["Shear force and bending moment diagrams", "Constructing diagrams and their significance"] },
            { title: "Pure Bending", topics: ["Theory of bending", "Bending stress formula"] },
            { title: "Columns and Struts", topics: ["Buckling", "Euler's formula", "Design considerations"] },
            { title: "Slope and Deflection", topics: ["Double integration method", "Moment area theorem", "Castigliano's theorem"] },
            { title: "Torsion", topics: ["Torsional stress", "Angle of twist"] },
            { title: "Truss", topics: ["Method of joints", "Method of sections", "Types of trusses"] },
            { title: "Springs", topics: ["Compression, tension and torsion springs", "Spring constants"] },
            { title: "Combined Direct and Bending Stress", topics: ["Superposition principle", "Design considerations"] },
        ],
    },
    {
        subject: "Fluid Mechanics",
        hours: 1,
        chapters: [
            { title: "Properties of Fluids", topics: ["Density and specific gravity", "Viscosity", "Surface tension", "Compressibility"] },
            { title: "Static Pressure", topics: ["Hydrostatic pressure", "Pressure variation with depth"] },
            { title: "Measurement of Pressure", topics: ["Manometers, barometers and pressure gauges", "Absolute, gauge and differential pressure"] },
            { title: "Fundamentals of Fluid Flow", topics: ["Types of flow: laminar, turbulent, transitional", "Continuity equation", "Bernoulli's equation"] },
            { title: "Flow Measurement", topics: ["Orifice meter and Venturi meter", "Rotameters and turbine flow meters"] },
        ],
    },
    {
        subject: "Physics & Chemistry",
        hours: 0.5,
        chapters: [
            // Physics
            { title: "Units and Measurement", topics: ["Fundamental and derived units; SI units", "Measurement of length, mass and time", "Measurement of area, volume and temperature", "Precision, accuracy and errors in measurement", "Dimensional analysis and conversion of units"] },
            { title: "Force and Laws of Motion", topics: ["Newton's laws of motion", "Applications of force and motion"] },
            { title: "Gravitation", topics: ["Universal law of gravitation", "Acceleration due to gravity"] },
            { title: "Work and Energy", topics: ["Work done by a force", "Kinetic and potential energy"] },
            { title: "Light", topics: ["Reflection and refraction of light", "Lenses and optical instruments"] },
            { title: "Electricity", topics: ["Electric current, voltage and resistance", "Ohm's law and circuits"] },
            { title: "Magnetic Effects of Current", topics: ["Magnetic fields and electromagnetism", "Applications of electromagnetism"] },
            { title: "Sources of Energy", topics: ["Renewable and non-renewable energy sources", "Energy conservation"] },
            { title: "Natural Resources", topics: ["Air, water and soil", "Conservation of natural resources", "Ecosystems, biodiversity and environmental issues"] },
            // Chemistry
            { title: "Structure of Atom", topics: ["Subatomic particles", "Atomic models and the quantum mechanical model", "Isotopes and isobars"] },
            { title: "Chemical Bonding", topics: ["Types of chemical bonds", "Lewis structures", "Polarity of molecules and intermolecular forces"] },
            { title: "Chemical Periodicity", topics: ["Periodic table and periodic law", "Trends in the periodic table", "Classification of elements"] },
            { title: "Acidity, Basicity and pH", topics: ["pH scale and calculation of pH", "Indicators", "Strength of acids and bases"] },
            { title: "Water", topics: ["Chemical properties of water", "Water quality", "Hydration and hydrolysis"] },
            { title: "Equilibrium", topics: ["Reversible reactions and dynamic equilibrium", "Equilibrium constant (K)", "Factors affecting equilibrium"] },
        ],
    },
    {
        subject: "Computer Awareness",
        hours: 0.5,
        chapters: [
            { title: "Computer Fundamentals", topics: ["General introduction to computers", "Development of computers", "Input and output devices", "Memory", "Personal computer"] },
            { title: "Data and Programming", topics: ["Design tools and programming", "Data representation", "Number system", "Software"] },
            { title: "Networking and Applications", topics: ["Data communication", "Internet", "Microsoft Windows", "Microsoft Office", "Computer abbreviations"] },
        ],
    },
];

// Build the Syllabus documents for one owner (createdBy). Chapters/topics get
// sequential `order`s so they display in the authored sequence, and every topic
// carries its subject's per-topic hour estimate.
function buildDocs(ownerId) {
    return IPU_LEET_SYLLABUS.map((s, i) => ({
        title: s.subject,
        subject: s.subject,
        exam: "IPU LEET",
        description: `Official IPU LEET (IPU CET 128) ${s.subject} syllabus.`,
        targets: ["ipu-leet"],
        published: true,
        scope: "global",
        order: i,
        createdBy: ownerId,
        chapters: s.chapters.map((c, ci) => ({
            title: c.title,
            order: ci,
            topics: c.topics.map((t, ti) => ({ title: t, estimatedHours: s.hours, order: ti })),
        })),
    }));
}

// One-time, edit-preserving migration: an earlier version seeded Physics and
// Chemistry as two separate subjects. Combine them into a single "Physics &
// Chemistry" (carrying whatever chapters currently exist, so staff edits are
// kept) and drop the two standalones. Runs once — afterwards the standalones no
// longer exist, so it's a no-op.
async function mergePhysicsChemistry() {
    const phys = await Syllabus.findOne({ targets: "ipu-leet", scope: "global", subject: "Physics" }).lean();
    const chem = await Syllabus.findOne({ targets: "ipu-leet", scope: "global", subject: "Chemistry" }).lean();
    if (!phys || !chem) return;
    if (await Syllabus.exists({ targets: "ipu-leet", subject: "Physics & Chemistry" })) return;

    const chapters = [...(phys.chapters || []), ...(chem.chapters || [])].map((c, i) => ({ ...c, order: i }));
    await Syllabus.create({
        title: "Physics & Chemistry",
        subject: "Physics & Chemistry",
        exam: phys.exam || "IPU LEET",
        description: "Official IPU LEET (IPU CET 128) Physics & Chemistry syllabus.",
        targets: ["ipu-leet"],
        published: phys.published !== false,
        scope: "global",
        order: phys.order,
        createdBy: phys.createdBy,
        chapters,
    });
    await Syllabus.deleteOne({ _id: phys._id });
    await Syllabus.deleteOne({ _id: chem._id });
    console.log("[ipu-syllabus] merged Physics + Chemistry into one subject");
}

async function ensureIpuSyllabusSeeded() {
    try {
        // Migrate a previously-seeded split Physics/Chemistry before anything else.
        await mergePhysicsChemistry();

        // Publish the clean official syllabus exactly ONCE. The flag makes it a
        // one-time action: it adds the clean subjects ALONGSIDE anything already
        // there (e.g. an earlier rough upload), never duplicates on later boots,
        // and never resurrects a subject staff delete afterwards.
        if (await SeedFlag.exists({ key: SEED_KEY })) return;

        // Attribute authorship to an admin (createdBy is required); fall back to
        // any user. If the DB has no users yet, skip — it'll publish on a later
        // boot (and only then is the flag set).
        const owner =
            (await User.findOne({ role: { $in: ["superadmin", "admin"] } }).sort({ createdAt: 1 }).select("_id").lean()) ||
            (await User.findOne().sort({ createdAt: 1 }).select("_id").lean());
        if (!owner) {
            console.warn("[ipu-syllabus] no user to attribute yet; will publish on a later boot");
            return;
        }

        // Add only the clean subjects not already present (by name), so an
        // existing rough upload is left untouched and nothing is duplicated.
        const present = new Set(
            (await Syllabus.find({ targets: "ipu-leet", scope: "global" }, "subject").lean()).map((s) => s.subject)
        );
        const docs = buildDocs(owner._id).filter((d) => !present.has(d.subject));
        if (docs.length) await Syllabus.insertMany(docs);
        await SeedFlag.create({ key: SEED_KEY });
        console.log(`[ipu-syllabus] published ${docs.length} IPU LEET subjects (one-time)`);
    } catch (e) {
        console.warn("[ipu-syllabus] publish skipped:", e.message);
    }
}

module.exports = { IPU_LEET_SYLLABUS, buildDocs, ensureIpuSyllabusSeeded };
