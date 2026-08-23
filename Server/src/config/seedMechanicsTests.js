const Test = require("../models/testModel");
const Question = require("../models/questionModel");
const User = require("../models/userModel");
const SeedFlag = require("../models/seedFlagModel");
const { TEST_FORMATS } = require("./testFormats");

// Engineering Mechanics practice sets, one per chapter, published as repeatable
// "practice" mode (answer + reason reveal as you go). Sizes follow the chapter's
// weight — long chapters get 20, medium 15, short 10. A few items come from
// examveda (permission on file); the rest are freshly authored, exam-focused
// questions whose answers are standard textbook facts or worked-out numericals.
// Each set carries a `topic` so it shows up under the Tests page chapter filter.

const q = (text, options, correctIndex, explanation) => ({ text, options, correctIndex, explanation });

// ── Engineering Mechanics — Mixed (10) : 4 examveda + 6 authored ──
const MECH_MIXED = [
    q("According to the parallel axis theorem, the moment of inertia of a section about an axis parallel to the axis through its centre of gravity is:", ["I_P = I_G + A·h²", "I_P = I_G − A·h²", "I_P = I_G / (A·h²)", "I_P = (A·h²) / I_G"], 0, "I_P = I_G + A·h², where A is the area and h the distance between the axes."),
    q("The friction experienced by a body when it is at rest is known as:", ["Static friction", "Dynamic friction", "Rolling friction", "Fluid friction"], 0, "A body at rest experiences static friction, which can rise up to the limiting value."),
    q("The energy possessed by a body by virtue of its position is called:", ["Potential energy", "Kinetic energy", "Strain energy", "Heat energy"], 0, "Position gives potential energy (e.g. m·g·h); motion gives kinetic energy."),
    q("For any system of coplanar forces, the conditions of equilibrium are:", ["ΣH = 0 (horizontal components)", "ΣV = 0 (vertical components)", "ΣM = 0 (moments about any point)", "All of the above"], 3, "A coplanar force system is in equilibrium only when ΣH = 0, ΣV = 0 and ΣM = 0."),
    q("By Newton's second law, a force of 20 N acting on a body of mass 4 kg produces an acceleration of:", ["4 m/s²", "5 m/s²", "16 m/s²", "80 m/s²"], 1, "a = F / m = 20 / 4 = 5 m/s²."),
    q("The weight of a body of mass 10 kg is (take g = 9.8 m/s²):", ["9.8 N", "98 N", "10 N", "980 N"], 1, "W = m·g = 10 × 9.8 = 98 N."),
    q("The SI unit of work and energy is the:", ["Newton", "Joule", "Watt", "Pascal"], 1, "Work = force × distance = N·m = joule; the watt is the unit of power."),
    q("The moment of a force about a point is the product of the force and the:", ["Parallel distance to the line of action", "Perpendicular distance of the point from the line of action", "Horizontal distance only", "Vertical distance only"], 1, "Moment = force × perpendicular distance from the point to the force's line of action."),
    q("The resultant of two equal forces P acting at right angles to each other is:", ["P", "P√2", "2P", "P / 2"], 1, "R = √(P² + P²) = P√2."),
    q("The kinetic energy of a body of mass m moving with velocity v is:", ["m·v", "½·m·v²", "m·g·h", "½·m·v"], 1, "Kinetic energy = ½·m·v²."),
];

// ── Friction (20) — long chapter ──
const MECH_FRICTION = [
    q("The force of friction between two surfaces is directly proportional to the:", ["Area of contact", "Normal reaction", "Weight, only when horizontal", "Velocity of the body"], 1, "F = μ·N, friction is proportional to the normal reaction, not to the contact area."),
    q("The ratio of the limiting friction to the normal reaction is called the:", ["Angle of friction", "Coefficient of friction", "Angle of repose", "Cone of friction"], 1, "μ = F_limiting / N is the coefficient of friction."),
    q("The coefficient of friction is equal to the ___ of the angle of friction.", ["Sine", "Cosine", "Tangent", "Cotangent"], 2, "μ = tan φ, where φ is the angle of friction."),
    q("The angle of repose is ___ the angle of friction.", ["Greater than", "Less than", "Equal to", "Twice"], 2, "The angle of repose equals the angle of friction (tan of each = μ)."),
    q("Limiting (static) friction is ___ kinetic (dynamic) friction.", ["Equal to", "Greater than", "Less than", "Independent of"], 1, "It takes more force to start motion than to keep it going, so limiting friction > kinetic friction."),
    q("According to the laws of dry friction, the force of friction is independent of the:", ["Normal reaction", "Nature of the surfaces", "Area of contact", "Coefficient of friction"], 2, "Friction depends on the normal reaction and the surfaces, but not on the (apparent) area of contact."),
    q("The friction that acts on a body which is moving is called:", ["Static friction", "Limiting friction", "Kinetic (dynamic) friction", "Rolling resistance"], 2, "A moving body experiences kinetic (dynamic) friction."),
    q("The maximum value of friction that acts on a body just before it begins to move is called:", ["Kinetic friction", "Limiting friction", "Rolling friction", "Fluid friction"], 1, "Limiting friction is the maximum static friction, reached just as motion is about to start."),
    q("The coefficient of friction:", ["Has the unit of newton", "Has the unit of newton per metre", "Has no units", "Has the unit of metre"], 2, "It is a ratio of two forces, so it is dimensionless."),
    q("A body of mass 10 kg rests on a rough horizontal surface with coefficient of friction 0.25. The horizontal force needed to just move it is (g = 10 m/s²):", ["2.5 N", "25 N", "50 N", "100 N"], 1, "F = μ·m·g = 0.25 × 10 × 10 = 25 N."),
    q("The angle of an inclined plane at which a body just begins to slide down under its own weight is called the angle of:", ["Friction", "Repose", "Inclination", "Projection"], 1, "That angle is the angle of repose (numerically equal to the angle of friction)."),
    q("The normal reaction on a body is 500 N and the coefficient of friction is 0.2. The limiting force of friction is:", ["50 N", "100 N", "200 N", "250 N"], 1, "F = μ·N = 0.2 × 500 = 100 N."),
    q("Rolling friction is ___ sliding friction.", ["Greater than", "Less than", "Equal to", "Unrelated to"], 1, "Rolling friction is much smaller than sliding friction, that's why wheels are used."),
    q("The right circular cone with the normal reaction as axis and semi-vertical angle equal to the angle of friction is called the:", ["Cone of friction", "Angle of repose", "Friction circle", "Cone of repose"], 0, "The cone of friction has a semi-vertical angle equal to the angle of friction."),
    q("In a ladder-friction problem, friction is usually considered at the:", ["Floor only", "Wall only", "Both the floor and the wall", "Neither surface"], 2, "Friction acts at both the floor and the wall contacts of the ladder."),
    q("The force of friction always acts in a direction ___ the direction of (impending) motion.", ["Same as", "Opposite to", "Perpendicular to", "At 45° to"], 1, "Friction opposes relative motion, so it acts opposite to the motion."),
    q("A body just moves on a horizontal plane when a horizontal force equal to 30% of its weight is applied. The coefficient of friction is:", ["0.15", "0.30", "0.60", "3.0"], 1, "μ = F / W = 0.30 (since on a horizontal plane N = W)."),
    q("If the coefficient of friction is 1, the angle of friction is:", ["30°", "45°", "60°", "90°"], 1, "φ = tan⁻¹(μ) = tan⁻¹(1) = 45°."),
    q("A body of weight 200 N rests on a horizontal surface with μ = 0.4. The maximum frictional force that can act on it is:", ["40 N", "80 N", "100 N", "120 N"], 1, "On a horizontal surface N = W = 200 N, so F = μ·N = 0.4 × 200 = 80 N."),
    q("Belt friction is governed by the relation T₁ / T₂ = e^(μθ), where θ is the:", ["Angle of the belt cross-section", "Angle of lap (contact) in radians", "Angle of friction", "Angle of repose"], 1, "θ is the angle of lap (wrap) of the belt on the pulley, measured in radians."),
];

// ── Equilibrium of Forces (15) — medium ──
const MECH_EQUILIBRIUM = [
    q("A system of forces acting on a body is said to be in equilibrium if the resultant of the forces is:", ["Maximum", "Zero", "Minimum but not zero", "Unity"], 1, "Equilibrium means the resultant force (and resultant moment) is zero."),
    q("Three coplanar concurrent forces in equilibrium are related by:", ["Lami's theorem", "The parallelogram law", "Varignon's theorem", "D'Alembert's principle"], 0, "Lami's theorem relates three concurrent coplanar forces in equilibrium."),
    q("Lami's theorem is applicable only to:", ["Two forces", "Three concurrent coplanar forces in equilibrium", "Four forces", "Any number of forces"], 1, "It applies to exactly three concurrent, coplanar forces in equilibrium."),
    q("By the principle of transmissibility, a force may be applied at any point along its:", ["Line of action", "Perpendicular", "Body's centroid", "Support"], 0, "A force can be moved anywhere along its line of action without changing its external effect."),
    q("For a body in equilibrium, the algebraic sum of the moments of all forces about any point is:", ["Maximum", "Zero", "Infinite", "Unity"], 1, "ΣM = 0 is one of the equilibrium conditions."),
    q("Varignon's theorem states that the moment of the resultant of a system of forces about any point equals the ___ of the moments of the individual forces about that point.", ["Product", "Algebraic sum", "Difference", "Ratio"], 1, "Moment of the resultant = algebraic sum of the moments of the components."),
    q("The point through which the whole weight of a body is assumed to act is its:", ["Centroid", "Centre of gravity", "Metacentre", "Moment centre"], 1, "The centre of gravity is the point where the body's weight acts."),
    q("Two forces are in equilibrium only if they are equal, opposite and:", ["Parallel", "Collinear", "Perpendicular", "Concurrent"], 1, "Two forces balance only when they are equal, opposite and act along the same line (collinear)."),
    q("The resultant of two forces of 3 N and 4 N acting at right angles to each other is:", ["1 N", "5 N", "7 N", "12 N"], 1, "R = √(3² + 4²) = √25 = 5 N."),
    q("If three forces acting at a point are in equilibrium, they can be represented in magnitude and direction by the three sides of a ___ taken in order.", ["Square", "Triangle", "Circle", "Polygon"], 1, "This is the triangle law of forces."),
    q("The resultant of a number of coplanar concurrent forces can be found by the ___ law of forces.", ["Parallelogram", "Polygon", "Newton's", "Hooke's"], 1, "The polygon law generalises the triangle law to more than two forces."),
    q("Two equal forces of 10 N act at a point with 60° between them. Their resultant is:", ["10 N", "17.32 N", "20 N", "14.14 N"], 1, "R = 2P·cos(θ/2) = 2 × 10 × cos 30° = 17.32 N."),
    q("A couple consists of two forces that are equal, opposite and:", ["Collinear", "Parallel but not collinear", "Perpendicular", "Concurrent"], 1, "A couple is two equal, opposite, parallel (non-collinear) forces producing pure rotation."),
    q("The moment of a couple equals the product of one of the forces and the:", ["Sum of the forces", "Perpendicular distance (arm) between them", "Angle between them", "Ratio of the forces"], 1, "Moment of a couple = force × arm (perpendicular distance between the two forces)."),
    q("Forces whose lines of action all pass through a single point are called:", ["Parallel forces", "Concurrent forces", "Coplanar forces", "Collinear forces"], 1, "Concurrent forces meet at (pass through) a common point."),
];

// ── Centroid & Moment of Inertia (15) — medium ──
const MECH_MOI = [
    q("The point at which the whole area of a plane figure is assumed to be concentrated is called the:", ["Centre of gravity", "Centroid", "Metacentre", "Moment centre"], 1, "For a plane area it is the centroid; for a solid body the corresponding point is the centre of gravity."),
    q("The centroid of a triangle lies at a distance of ___ of its height, measured from the base.", ["h/2", "h/3", "h/4", "2h/3"], 1, "The centroid of a triangle is at h/3 above the base."),
    q("The centroid of a semicircle of radius r lies at a distance from the base (diameter) of:", ["r/2", "4r / 3π", "3r/8", "r/π"], 1, "For a semicircular area the centroid is 4r/3π from the diameter."),
    q("The moment of inertia of a rectangular section (width b, depth d) about its centroidal axis parallel to the width is:", ["b·d³/3", "b·d³/12", "d·b³/12", "b·d²/6"], 1, "I = b·d³/12 about the centroidal axis parallel to the width."),
    q("The moment of inertia of a circular section of diameter d about its diametral (centroidal) axis is:", ["π·d⁴/32", "π·d⁴/64", "π·d³/32", "π·d²/4"], 1, "I = π·d⁴/64 about a diameter."),
    q("The unit of moment of inertia of an area is:", ["m²", "m³", "m⁴", "m"], 2, "Area moment of inertia has units of length⁴ (e.g. mm⁴, m⁴)."),
    q("According to the parallel axis theorem, I = I_G + ___.", ["A·h", "A·h²", "A / h²", "A²·h"], 1, "I = I_G + A·h², where A is the area and h the distance between the axes."),
    q("The perpendicular axis theorem states that I_zz =", ["I_xx − I_yy", "I_xx + I_yy", "I_xx × I_yy", "I_xx / I_yy"], 1, "The polar MI equals the sum of the two rectangular MIs: I_zz = I_xx + I_yy."),
    q("The polar moment of inertia of a circular section of diameter d is:", ["π·d⁴/16", "π·d⁴/32", "π·d⁴/64", "π·d⁴/8"], 1, "J = π·d⁴/32 for a solid circular section."),
    q("The radius of gyration k is related to the moment of inertia I and area A by:", ["k = I/A", "k = √(I/A)", "k = A/I", "k = √(A/I)"], 1, "I = A·k², so k = √(I/A)."),
    q("The moment of inertia of a triangular section (base b, height h) about its base is:", ["b·h³/12", "b·h³/36", "b·h³/3", "b·h³/4"], 0, "About the base I = b·h³/12; about the centroidal axis it is b·h³/36."),
    q("The moment of inertia of a triangular section about a centroidal axis parallel to the base is:", ["b·h³/12", "b·h³/36", "b·h³/3", "b·h³/4"], 1, "About the centroid I = b·h³/36."),
    q("The centre of gravity of a solid hemisphere of radius r lies from its base at:", ["r/2", "3r/8", "4r / 3π", "3r/4"], 1, "For a solid hemisphere the CG is 3r/8 from the flat base."),
    q("A rectangle is 60 mm wide and 40 mm deep. Its moment of inertia about the centroidal axis parallel to the width (b·d³/12) is:", ["160000 mm⁴", "320000 mm⁴", "640000 mm⁴", "1280000 mm⁴"], 1, "I = 60 × 40³ / 12 = 60 × 64000 / 12 = 320000 mm⁴."),
    q("The moment of inertia of a section is a measure of its resistance to:", ["Axial load", "Bending", "Temperature change", "Corrosion"], 1, "A larger area moment of inertia means greater resistance to bending."),
];

// ── Kinematics of Motion (15) — medium ──
const MECH_KINEMATICS = [
    q("The rate of change of displacement of a body is called its:", ["Speed", "Velocity", "Acceleration", "Momentum"], 1, "Velocity is the rate of change of displacement (a vector)."),
    q("The rate of change of velocity is called:", ["Speed", "Displacement", "Acceleration", "Momentum"], 2, "Acceleration is the rate of change of velocity."),
    q("For uniformly accelerated motion, the final velocity is given by v =", ["u + a·t", "u + ½·a·t²", "u² + 2·a·s", "u + a·t²"], 0, "v = u + a·t is the first equation of motion."),
    q("The equation v² = u² + 2·a·s relates velocity to:", ["Time", "Displacement", "Mass", "Force"], 1, "This equation links velocity with displacement s (time-independent)."),
    q("A body starts from rest and accelerates uniformly at 2 m/s² for 5 s. Its final velocity is:", ["5 m/s", "10 m/s", "25 m/s", "2.5 m/s"], 1, "v = u + a·t = 0 + 2 × 5 = 10 m/s."),
    q("A body starts from rest with an acceleration of 2 m/s². The distance travelled in 5 s is:", ["10 m", "25 m", "50 m", "5 m"], 1, "s = u·t + ½·a·t² = 0 + ½ × 2 × 25 = 25 m."),
    q("Neglecting air resistance, the path of a projectile is a:", ["Straight line", "Circle", "Parabola", "Ellipse"], 2, "A projectile follows a parabolic path."),
    q("For a given speed, the maximum horizontal range of a projectile is obtained at a projection angle of:", ["30°", "45°", "60°", "90°"], 1, "Range is maximum at 45° (since range ∝ sin 2θ)."),
    q("A ball is thrown vertically upward with 20 m/s. The maximum height it reaches is (g = 10 m/s²):", ["10 m", "20 m", "40 m", "2 m"], 1, "h = u² / (2g) = 400 / 20 = 20 m."),
    q("The time of flight of a projectile depends on the ___ component of its initial velocity.", ["Horizontal", "Vertical", "Resultant", "None of these"], 1, "Time of flight = 2·u·sinθ / g, which depends on the vertical component."),
    q("A car moving at 20 m/s is brought to rest in 4 s. Its retardation is:", ["4 m/s²", "5 m/s²", "80 m/s²", "0.2 m/s²"], 1, "a = (v − u)/t = (0 − 20)/4 = −5 m/s²; the retardation is 5 m/s²."),
    q("Neglecting air resistance, the horizontal component of a projectile's velocity:", ["Increases", "Decreases", "Remains constant", "Becomes zero at the top"], 2, "There is no horizontal force, so the horizontal velocity stays constant."),
    q("A body moving at 10 m/s accelerates at 2 m/s² for 3 s. The distance it covers is:", ["30 m", "39 m", "48 m", "21 m"], 1, "s = u·t + ½·a·t² = 10 × 3 + ½ × 2 × 9 = 30 + 9 = 39 m."),
    q("Displacement is a ___ quantity.", ["Scalar", "Vector", "Dimensionless", "Fundamental unit"], 1, "Displacement has both magnitude and direction, so it is a vector."),
    q("At the highest point of its trajectory, the vertical velocity of a projectile is:", ["Maximum", "Zero", "Equal to the horizontal velocity", "Minimum but not zero"], 1, "The vertical velocity is momentarily zero at the peak; only the horizontal component remains."),
];

// ── Simple Machines (10) — short ──
const MECH_MACHINES = [
    q("The ratio of the load lifted to the effort applied in a machine is called the:", ["Velocity ratio", "Mechanical advantage", "Efficiency", "Input"], 1, "Mechanical advantage (MA) = load / effort."),
    q("The ratio of the distance moved by the effort to the distance moved by the load is called the:", ["Mechanical advantage", "Velocity ratio", "Efficiency", "Load factor"], 1, "Velocity ratio (VR) = distance moved by effort / distance moved by load."),
    q("The efficiency of a machine is the ratio of:", ["Input to output", "Output to input (i.e. MA / VR)", "Load to effort", "Effort to load"], 1, "Efficiency = work output / work input = MA / VR."),
    q("A machine with 100% efficiency (no friction) is called an ___ machine.", ["Actual", "Ideal", "Self-locking", "Compound"], 1, "A frictionless, 100%-efficient machine is an ideal machine."),
    q("A machine that keeps working in the reverse direction after the effort is removed is called a ___ machine.", ["Self-locking", "Reversible", "Ideal", "Compound"], 1, "A reversible machine runs backward when the effort is removed."),
    q("A machine is self-locking (non-reversible) when its efficiency is:", ["Greater than 50%", "Less than 50%", "Equal to 100%", "Equal to 0%"], 1, "If efficiency < 50% the machine is self-locking."),
    q("In a machine, an effort of 20 N lifts a load of 100 N. The mechanical advantage is:", ["2", "5", "20", "500"], 1, "MA = load / effort = 100 / 20 = 5."),
    q("A machine has a velocity ratio of 8 and a mechanical advantage of 6. Its efficiency is:", ["48%", "75%", "133%", "14%"], 1, "Efficiency = MA / VR = 6 / 8 = 0.75 = 75%."),
    q("In a simple wheel and axle, the velocity ratio equals the ratio of the:", ["Axle radius to wheel radius", "Wheel radius to axle radius", "Load to effort", "Effort to load"], 1, "VR = radius (or diameter) of the wheel / radius of the axle."),
    q("For a screw jack with pitch p and effort-arm length l, the velocity ratio is:", ["p / (2πl)", "2πl / p", "πl / p", "2πp / l"], 1, "VR = 2πl / p, the effort moves 2πl while the load rises by the pitch p."),
];

// ── Trusses (10) — short ──
const MECH_TRUSSES = [
    q("A truss having just enough members to keep it in equilibrium is called a ___ truss.", ["Perfect", "Imperfect", "Redundant", "Deficient"], 0, "A perfect truss has exactly the members needed for stability (m = 2j − 3)."),
    q("For a perfect plane truss with j joints, the number of members m is:", ["m = 2j − 3", "m = j − 2", "m = 3j − 2", "m = 2j + 3"], 0, "The perfect-truss relation is m = 2j − 3."),
    q("In the method of joints, the forces at every joint must satisfy:", ["Maximum force", "ΣH = 0 and ΣV = 0 (equilibrium)", "Force equal to the load", "Infinite force"], 1, "Each joint is a concurrent-force system in equilibrium: ΣH = 0, ΣV = 0."),
    q("The members of an ideal (simple) truss are assumed to carry only ___ forces.", ["Bending", "Axial (tension or compression)", "Shear", "Torsional"], 1, "Truss members are two-force members carrying only axial force."),
    q("A truss member carrying a pulling force is said to be in:", ["Tension", "Compression", "Shear", "Bending"], 0, "A member being pulled (stretched) is in tension."),
    q("A truss member carrying a pushing force is said to be in:", ["Tension", "Compression", "Torsion", "Bending"], 1, "A member being pushed (shortened) is in compression."),
    q("In the analysis of a truss, the external loads are assumed to be applied only at the:", ["Mid-span of members", "Joints", "Supports only", "Centre of gravity"], 1, "Loads are applied at the joints so members carry only axial force."),
    q("A truss having more members than required for equilibrium is called a ___ truss.", ["Perfect", "Redundant (imperfect)", "Deficient", "Simple"], 1, "More members than 2j − 3 makes it a redundant (over-stiff) truss."),
    q("A plane truss has 7 joints. To be a perfect truss, the number of members required is:", ["10", "11", "14", "7"], 1, "m = 2j − 3 = 2 × 7 − 3 = 11."),
    q("The method used to find the force in a particular member of a truss directly (by cutting through it) is the method of:", ["Joints", "Sections", "Virtual work", "Superposition"], 1, "The method of sections cuts the truss to expose a chosen member's force directly."),
];

const TESTS = [
    { slug: "mixed", topic: "Engineering Mechanics", title: "Mechanics: Engineering Mechanics, Quick Shot", format: "quick-shot", questions: MECH_MIXED, blurb: "10 mixed Engineering Mechanics questions across friction, forces, energy and moment of inertia. Practice mode, the answer reveals as you go." },
    { slug: "friction", topic: "Friction", title: "Mechanics: Friction, Practice", format: null, questions: MECH_FRICTION, blurb: "20 practice questions on friction, laws of friction, angle of friction & repose, inclined planes and numericals. Answers reveal as you go." },
    { slug: "equilibrium", topic: "Equilibrium of Forces", title: "Mechanics: Equilibrium of Forces, Practice", format: null, questions: MECH_EQUILIBRIUM, blurb: "15 practice questions on force systems and equilibrium, Lami's theorem, moments, couples and resultants." },
    { slug: "moment-of-inertia", topic: "Moment of Inertia", title: "Mechanics: Centroid & Moment of Inertia, Practice", format: null, questions: MECH_MOI, blurb: "15 practice questions on centroids and area moment of inertia, standard formulae, the axis theorems and numericals." },
    { slug: "kinematics", topic: "Kinematics", title: "Mechanics: Kinematics of Motion, Practice", format: null, questions: MECH_KINEMATICS, blurb: "15 practice questions on kinematics, equations of motion, projectiles and worked numericals." },
    { slug: "simple-machines", topic: "Simple Machines", title: "Mechanics: Simple Machines, Quick Shot", format: "quick-shot", questions: MECH_MACHINES, blurb: "10 practice questions on simple machines, mechanical advantage, velocity ratio, efficiency and self-locking." },
    { slug: "trusses", topic: "Trusses", title: "Mechanics: Trusses, Quick Shot", format: "quick-shot", questions: MECH_TRUSSES, blurb: "10 practice questions on plane trusses, perfect trusses, method of joints/sections, tension and compression." },
];

// Publish each Mechanics chapter set once (per-test SeedFlag), as repeatable
// practice attributed to an admin. Custom-size sets (15 / 20) use format: null.
async function ensureMechanicsTestsSeeded() {
    try {
        const owner =
            (await User.findOne({ role: { $in: ["superadmin", "admin"] } }).sort({ createdAt: 1 }).select("_id").lean()) ||
            (await User.findOne().sort({ createdAt: 1 }).select("_id").lean());
        if (!owner) {
            console.warn("[mechanics] no user to attribute yet; will publish on a later boot");
            return;
        }

        for (const t of TESTS) {
            const key = `mechanics-${t.slug}-v1`;
            if (await SeedFlag.exists({ key })) continue;

            // Fixed-format sets must match their locked count; custom sets (null) don't.
            if (t.format && TEST_FORMATS[t.format] && t.questions.length !== TEST_FORMATS[t.format].count) {
                console.warn(`[mechanics] ${t.topic} has ${t.questions.length}, expected ${TEST_FORMATS[t.format].count}, skipped`);
                continue;
            }

            const docs = await Question.insertMany(
                t.questions.map((qq) => ({
                    text: qq.text,
                    options: [...qq.options],
                    correctIndex: qq.correctIndex,
                    explanation: qq.explanation,
                    subject: "Mechanics",
                    topic: t.topic,
                    difficulty: "moderate",
                    marks: 1,
                    createdBy: owner._id,
                }))
            );
            await Test.create({
                title: t.title,
                description: t.blurb,
                subject: "Mechanics",
                topic: t.topic,
                category: "topic-wise",
                format: t.format || null,
                mode: "practice",
                durationMinutes: docs.length,
                targets: [],
                questions: docs.map((d) => d._id),
                totalMarks: docs.length,
                status: "published",
                isPublished: true,
                createdBy: owner._id,
            });
            await SeedFlag.create({ key });
            console.log(`[mechanics] published ${t.title} (${docs.length} Q)`);
        }
    } catch (e) {
        console.warn("[mechanics] seed skipped:", e.message);
    }
}

module.exports = {
    MECH_MIXED,
    MECH_FRICTION,
    MECH_EQUILIBRIUM,
    MECH_MOI,
    MECH_KINEMATICS,
    MECH_MACHINES,
    MECH_TRUSSES,
    TESTS,
    ensureMechanicsTestsSeeded,
};

