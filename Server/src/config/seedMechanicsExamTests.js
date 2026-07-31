const Test = require("../models/testModel");
const Question = require("../models/questionModel");
const User = require("../models/userModel");
const SeedFlag = require("../models/seedFlagModel");
const { TEST_FORMATS } = require("./testFormats");

// A second, larger batch of Engineering Mechanics practice — modelled on the
// LEET / lateral-entry Engineering Mechanics syllabus and the way it's examined:
//   • 5 TOPIC-wise Quick Shots (10 Q each) — tight drills on one topic.
//   • 4 CHAPTER-wise sets (25 Q each) — a full chapter's worth per test.
// All are freshly authored, exam-focused questions built on standard textbook
// facts and worked-out numericals (every number below is checked). Published as
// repeatable "practice" mode, so the answer + reason reveal as the student goes.
// Distinct from the questions in seedMechanicsTests.js.

const q = (text, options, correctIndex, explanation) => ({ text, options, correctIndex, explanation });

/* ───────────────────────── TOPIC-WISE QUICK SHOTS (10 each) ───────────────────────── */

// Topic 1 — Resultant of Forces
const T_RESULTANT = [
    q("Two forces of 5 N and 12 N act on a body at right angles to each other. Their resultant is:", ["13 N", "17 N", "7 N", "60 N"], 0, "R = √(5² + 12²) = √(25 + 144) = √169 = 13 N."),
    q("Two equal forces have a resultant equal to one of the forces. The angle between them is:", ["60°", "90°", "120°", "180°"], 2, "R = 2P·cos(θ/2) = P ⇒ cos(θ/2) = 0.5 ⇒ θ/2 = 60° ⇒ θ = 120°."),
    q("The horizontal component of a 200 N force inclined at 60° to the horizontal is:", ["100 N", "173.2 N", "50 N", "200 N"], 0, "Horizontal component = 200·cos 60° = 200 × 0.5 = 100 N."),
    q("The vertical component of a 50 N force inclined at 30° to the horizontal is:", ["25 N", "43.3 N", "50 N", "12.5 N"], 0, "Vertical component = 50·sin 30° = 50 × 0.5 = 25 N."),
    q("The resultant of two concurrent forces is found using the:", ["Parallelogram law of forces", "Law of moments", "Principle of transmissibility", "Hooke's law"], 0, "The parallelogram (or triangle) law gives the resultant of two concurrent forces."),
    q("The resultant of two forces of 10 N each acting at 90° to each other is:", ["10 N", "14.14 N", "20 N", "5 N"], 1, "R = √(10² + 10²) = 10√2 ≈ 14.14 N."),
    q("The resultant of two collinear forces acting in the same direction, of magnitudes P and Q, is:", ["P − Q", "P + Q", "√(P² + Q²)", "PQ"], 1, "Like collinear forces simply add: R = P + Q (this is also the maximum possible resultant)."),
    q("Two opposite collinear forces of 15 N and 9 N give a resultant of:", ["24 N", "6 N", "135 N", "12 N"], 1, "Unlike collinear forces subtract: R = 15 − 9 = 6 N, acting along the larger force."),
    q("Three concurrent forces in equilibrium can be represented in magnitude and direction by the three sides of a triangle taken in order. This is the:", ["Polygon law", "Triangle law of forces", "Parallel axis theorem", "Lami's theorem"], 1, "The triangle law of forces represents three balanced concurrent forces by the sides of a triangle."),
    q("Two forces of 20 N each act at 60° to each other. Their resultant is about:", ["20 N", "34.64 N", "40 N", "28.28 N"], 1, "R = 2P·cos(θ/2) = 2 × 20 × cos 30° = 40 × 0.866 = 34.64 N."),
];

// Topic 2 — Moment & Couple
const T_MOMENT = [
    q("The moment of a force about a point is the product of the force and the:", ["Perpendicular distance from the point to its line of action", "Parallel distance", "Square of the distance", "Velocity"], 0, "Moment = force × perpendicular distance from the point to the force's line of action."),
    q("A force of 50 N acts at a perpendicular distance of 2 m from a point. The moment of the force is:", ["25 N·m", "52 N·m", "100 N·m", "48 N·m"], 2, "Moment = 50 × 2 = 100 N·m."),
    q("The SI unit of the moment of a force is:", ["Newton", "Joule", "Watt", "Newton-metre (N·m)"], 3, "Moment = force × distance, so its unit is the newton-metre (N·m)."),
    q("Varignon's theorem states that the moment of the resultant of a force system about any point equals the:", ["Product of the moments of the components", "Algebraic sum of the moments of the components", "Difference of the forces", "Ratio of the moments"], 1, "Moment of the resultant = algebraic sum of the moments of the individual forces (components)."),
    q("A couple is formed by two forces that are equal, parallel and:", ["Acting in the same direction along one line", "Perpendicular to each other", "Opposite in direction but not collinear", "Concurrent"], 2, "A couple is two equal, opposite, parallel (non-collinear) forces."),
    q("Two parallel forces of 20 N each act 0.5 m apart forming a couple. The moment of the couple is:", ["40 N·m", "20.5 N·m", "100 N·m", "10 N·m"], 3, "Moment of a couple = force × arm = 20 × 0.5 = 10 N·m."),
    q("The moment of a couple about any point in its plane is:", ["Zero", "The same (a free vector)", "Maximum at the mid-point", "Dependent on the point chosen"], 1, "A couple's moment is the same about every point in its plane — it is a free vector."),
    q("A couple acting on a body tends to produce:", ["Translation only", "No effect", "Pure rotation", "Bending only"], 2, "A couple has no resultant force, so it produces pure rotation (a turning effect)."),
    q("A spanner 0.25 m long is turned by a force of 40 N applied at right angles to it. The turning moment is:", ["10 N·m", "16 N·m", "160 N·m", "0.16 N·m"], 0, "Moment = 40 × 0.25 = 10 N·m."),
    q("The perpendicular distance between the two forces forming a couple is called the:", ["Lever", "Radius", "Span", "Arm of the couple"], 3, "That perpendicular distance is the arm (or lever arm) of the couple."),
];

// Topic 3 — Centre of Gravity & Centroid
const T_CENTROID = [
    q("The centre of gravity of a uniform straight rod lies at its:", ["One end", "Mid-point", "One-third point", "Quarter point"], 1, "By symmetry the CG of a uniform rod is at its mid-point."),
    q("The centroid of a rectangle lies at the:", ["Mid-point of one side", "One corner", "Intersection of its diagonals", "One-third of the height"], 2, "The centroid of a rectangle is at its geometric centre — where the diagonals cross."),
    q("A triangular lamina has a height of 24 cm. Its centroid lies above the base at a distance of:", ["8 cm", "6 cm", "12 cm", "16 cm"], 0, "Centroid of a triangle is at h/3 from the base = 24/3 = 8 cm."),
    q("The centroid of a semicircular lamina of radius r, measured from its diameter, lies at:", ["r/2", "4r/3π", "3r/8", "2r/π"], 1, "For a semicircular area the centroid is 4r/3π from the diameter."),
    q("The centre of gravity of a solid right circular cone of height h lies on its axis, measured from the base, at:", ["h/2", "h/3", "h/4", "3h/4"], 2, "The CG of a solid cone is at h/4 above the base."),
    q("The centre of gravity of a solid hemisphere of radius r, measured from its flat face, is at:", ["r/2", "4r/3π", "3r/4", "3r/8"], 3, "For a solid hemisphere the CG is 3r/8 from the flat base."),
    q("The centroid of a composite (built-up) area is located by taking:", ["The largest sub-area only", "The average of the corner points", "Moments of the component areas about a reference axis", "The mid-point of the longest side"], 2, "Composite-area centroid: x̄ = Σ(aᵢxᵢ)/Σaᵢ — the principle of moments applied to areas."),
    q("For a body having an axis of symmetry, the centroid always lies:", ["Off the axis", "On the axis of symmetry", "At a corner", "At the top"], 1, "Symmetry forces the centroid onto the axis of symmetry."),
    q("The centroid of a semicircular wire (arc) of radius r lies from the centre at a distance of:", ["4r/3π", "r/2", "r/π", "2r/π"], 3, "For a semicircular arc (a line, not an area) the centroid is 2r/π from the centre."),
    q("The centroid and the centre of gravity of a thin uniform plate:", ["Coincide", "Are always different points", "Are at opposite ends", "Cannot be defined"], 0, "For a thin uniform plate the geometric centroid coincides with the centre of gravity."),
];

// Topic 4 — Projectile Motion
const T_PROJECTILE = [
    q("Neglecting air resistance, the path traced by a projectile is a:", ["Straight line", "Circle", "Parabola", "Hyperbola"], 2, "A projectile follows a parabolic path under gravity."),
    q("For a projectile (no air resistance), the horizontal component of velocity:", ["Increases uniformly", "Decreases uniformly", "Remains constant", "Becomes zero at the top"], 2, "No horizontal force acts, so the horizontal velocity stays constant throughout."),
    q("The horizontal range of a projectile is maximum when the angle of projection is:", ["30°", "45°", "60°", "90°"], 1, "Range ∝ sin 2θ, which is maximum (= 1) at θ = 45°."),
    q("A body is projected at 20 m/s at 30° to the horizontal. Its horizontal component of velocity is:", ["10 m/s", "17.32 m/s", "20 m/s", "8.66 m/s"], 1, "uₓ = u·cos 30° = 20 × 0.866 = 17.32 m/s."),
    q("A projectile is launched at 20 m/s at 30° (g = 10 m/s²). Its time of flight is:", ["1 s", "2 s", "4 s", "0.5 s"], 1, "T = 2u·sinθ/g = 2 × 20 × 0.5 / 10 = 2 s."),
    q("For the same projectile (u = 20 m/s, θ = 30°, g = 10 m/s²), the maximum height reached is:", ["5 m", "10 m", "20 m", "2.5 m"], 0, "H = u²·sin²θ/(2g) = 400 × 0.25 / 20 = 5 m."),
    q("For the same projectile (u = 20 m/s, θ = 30°, g = 10 m/s²), the horizontal range is about:", ["20 m", "34.64 m", "40 m", "17.32 m"], 1, "R = u²·sin2θ/g = 400 × sin 60° / 10 = 400 × 0.866 / 10 = 34.64 m."),
    q("At the highest point of its trajectory, the velocity of a projectile is:", ["Zero", "Purely horizontal (= u·cosθ)", "Purely vertical", "Maximum"], 1, "The vertical component is momentarily zero at the top; only the horizontal component u·cosθ remains."),
    q("A body projected at 30 m/s at 45° has a maximum range of (g = 10 m/s²):", ["45 m", "90 m", "60 m", "180 m"], 1, "R_max = u²/g = 30² / 10 = 900/10 = 90 m (at 45°)."),
    q("Projectile motion is a combination of:", ["Two uniformly accelerated motions", "Uniform horizontal velocity and uniformly accelerated vertical motion", "Two circular motions", "Uniform motion in a straight line"], 1, "Horizontally the velocity is uniform; vertically the motion is uniformly accelerated by g."),
];

// Topic 5 — Work, Power & Energy
const T_WORK = [
    q("Work done by a force is the product of the force and the displacement:", ["Perpendicular to the force", "In the direction of the force", "Of the point of support", "At right angles to gravity"], 1, "Work = force × displacement measured in the direction of the force."),
    q("A constant force of 20 N moves a body 5 m along its line of action. The work done is:", ["4 J", "25 J", "100 J", "15 J"], 2, "Work = 20 × 5 = 100 J."),
    q("When the displacement is perpendicular to the applied force, the work done is:", ["Zero", "Maximum", "Negative", "Equal to the force"], 0, "Work = F·s·cos 90° = 0 when displacement is perpendicular to the force."),
    q("The kinetic energy of a 2 kg body moving at 10 m/s is:", ["20 J", "200 J", "50 J", "100 J"], 3, "KE = ½·m·v² = ½ × 2 × 10² = 100 J."),
    q("The potential energy of a 5 kg body raised to a height of 4 m (g = 10 m/s²) is:", ["20 J", "50 J", "200 J", "9 J"], 2, "PE = m·g·h = 5 × 10 × 4 = 200 J."),
    q("Power is defined as the:", ["Product of force and time", "Rate of doing work", "Total work done", "Force per unit area"], 1, "Power = work done ÷ time taken; its SI unit is the watt."),
    q("A pump does 600 J of work in 12 s. Its power output is:", ["50 W", "12 W", "600 W", "7200 W"], 0, "Power = work/time = 600/12 = 50 W."),
    q("The work-energy principle states that the work done by the resultant force equals the change in the body's:", ["Momentum", "Kinetic energy", "Potential energy", "Mass"], 1, "Work done by the resultant force = change in kinetic energy of the body."),
    q("A motor rated at 1 kW delivers work each second equal to:", ["100 J", "746 J", "60 J", "1000 J"], 3, "1 kW = 1000 W = 1000 J per second."),
    q("The energy possessed by a body by virtue of its motion is called:", ["Potential energy", "Strain energy", "Kinetic energy", "Heat energy"], 2, "Motion gives kinetic energy (½mv²); position gives potential energy."),
];

/* ───────────────────────── CHAPTER-WISE SETS (25 each) ───────────────────────── */

// Chapter A — Statics: Force Systems & Equilibrium (25)
const C_STATICS = [
    q("A force is completely specified by its magnitude, direction and:", ["Colour", "Point of application", "Temperature", "Duration"], 1, "A force is a vector defined by magnitude, direction (line of action + sense) and point of application."),
    q("Forces whose lines of action pass through a single common point are called:", ["Parallel forces", "Collinear forces", "Concurrent forces", "Like forces"], 2, "Concurrent forces meet at a common point."),
    q("Forces acting in a single plane are called:", ["Coplanar forces", "Spatial forces", "Collinear forces", "Concurrent forces"], 0, "Forces lying in one plane are coplanar."),
    q("The resultant of two forces of 8 N and 6 N acting at right angles is:", ["14 N", "10 N", "2 N", "48 N"], 1, "R = √(8² + 6²) = √(64 + 36) = √100 = 10 N."),
    q("The parallelogram law is used to determine the:", ["Moment of a couple", "Centroid of an area", "Radius of gyration", "Resultant of two concurrent forces"], 3, "It gives the resultant of two forces acting at a point."),
    q("Splitting a single force into two components is known as:", ["Composition", "Transmission", "Resolution", "Superposition"], 2, "Resolution is the reverse of composition — replacing a force by its components."),
    q("The horizontal component of a 100 N force inclined at 60° to the horizontal is:", ["50 N", "86.6 N", "100 N", "60 N"], 0, "Horizontal component = 100·cos 60° = 100 × 0.5 = 50 N."),
    q("The principle of transmissibility says a force may be applied at any point along its:", ["Perpendicular", "Component", "Support", "Line of action"], 3, "A force can be moved along its line of action without changing its external effect on a rigid body."),
    q("The moment of a force about a point equals the force multiplied by the:", ["Parallel distance", "Perpendicular distance to its line of action", "Square of the distance", "Angle of the force"], 1, "Moment = force × perpendicular distance from the point to the line of action."),
    q("Varignon's theorem is also known as the:", ["Law of moments (moment of the resultant = Σ moments)", "Law of friction", "Law of inertia", "Law of gravitation"], 0, "Varignon's theorem: the moment of the resultant equals the sum of the moments of the components."),
    q("A couple is characterised by a moment and produces:", ["Translation only", "Neither", "Pure rotation", "A change in mass"], 2, "A couple has zero resultant force, so it causes pure rotation."),
    q("For a coplanar concurrent force system in equilibrium, the conditions are:", ["ΣM = 0 only", "ΣH = 0 only", "Σ forces = maximum", "ΣH = 0 and ΣV = 0"], 3, "Concurrent forces have no moment arm about the meeting point, so equilibrium needs ΣH = 0 and ΣV = 0."),
    q("For a coplanar non-concurrent force system, equilibrium additionally requires:", ["ΣM = 0", "The forces to be equal", "A couple", "Zero mass"], 0, "Besides ΣH = 0 and ΣV = 0, a non-concurrent system also needs ΣM = 0."),
    q("Lami's theorem applies only to:", ["Two forces", "Four parallel forces", "Three concurrent coplanar forces in equilibrium", "Any number of forces"], 2, "Lami's theorem relates exactly three concurrent, coplanar forces in equilibrium."),
    q("By Lami's theorem, each force is proportional to the sine of the angle between the:", ["Same two forces", "Other two forces", "Force and the vertical", "Force and the horizontal"], 1, "P/sin α = Q/sin β = R/sin γ, where each angle is between the other two forces."),
    q("Three forces keeping a body in equilibrium can be represented by the three sides of a triangle taken in order — the:", ["Polygon law", "Parallelogram law", "Lami's theorem", "Triangle law of forces"], 3, "This is the triangle law of forces (a special case of the polygon law)."),
    q("For more than three concurrent forces in equilibrium, the force diagram forms a:", ["Straight line", "Circle", "Closed polygon", "Single point"], 2, "The polygon law: balanced concurrent forces form a closed polygon when drawn head-to-tail."),
    q("Two like parallel forces of 20 N and 30 N have a resultant of:", ["10 N", "50 N", "600 N", "25 N"], 1, "Like parallel forces add: R = 20 + 30 = 50 N, acting between them."),
    q("The resultant of two like parallel forces divides the distance between them:", ["Internally in the inverse ratio of the forces", "Externally in the direct ratio", "At the mid-point always", "At the larger force"], 0, "The resultant lies nearer the larger force, dividing the gap internally in the inverse ratio of the magnitudes."),
    q("Two forces are in equilibrium only when they are equal, opposite and:", ["Parallel", "Perpendicular", "Collinear", "Concurrent at 60°"], 2, "Two balancing forces must be equal, opposite and act along the same straight line (collinear)."),
    q("Two equal and opposite forces that are not collinear form a:", ["Resultant force", "State of rest", "Zero system", "Couple"], 3, "Equal, opposite, non-collinear forces have no single resultant — they form a couple."),
    q("A free body diagram shows the isolated body together with:", ["Only its weight", "All the external forces (and reactions) acting on it", "Only the applied load", "Its internal stresses"], 1, "An FBD isolates the body and marks every external force and support reaction on it."),
    q("The reaction of a smooth (frictionless) surface on a body acts:", ["Normal (perpendicular) to the surface", "Along the surface", "At 45°", "In the direction of motion"], 0, "A smooth surface can only push perpendicular to itself, so its reaction is normal to the surface."),
    q("The resultant of two forces of 9 N and 12 N acting at right angles is:", ["21 N", "15 N", "3 N", "108 N"], 1, "R = √(9² + 12²) = √(81 + 144) = √225 = 15 N."),
    q("When the resultant of all the forces on a body is zero, the body is:", ["Accelerating", "Rotating faster", "In equilibrium", "Decelerating only"], 2, "A zero resultant (force and moment) means the body is in equilibrium."),
];

// Chapter B — Friction (25)
const C_FRICTION = [
    q("The force of friction always acts in a direction:", ["Along the motion", "Opposite to the (impending) motion", "Perpendicular to the surface", "Vertically upward"], 1, "Friction opposes relative motion, so it acts opposite to the direction of (impending) sliding."),
    q("The maximum value of friction that acts just before a body starts to move is called:", ["Kinetic friction", "Limiting friction", "Rolling friction", "Fluid friction"], 1, "Limiting friction is the maximum static friction, reached at the point of impending motion."),
    q("The coefficient of friction is the ratio of the limiting friction to the:", ["Weight", "Normal reaction", "Applied force", "Area of contact"], 1, "μ = F_limiting / N."),
    q("The coefficient of friction is related to the angle of friction φ by:", ["μ = sin φ", "μ = cos φ", "μ = tan φ", "μ = cot φ"], 2, "μ = tan φ, where φ is the angle of friction."),
    q("The coefficient of friction has units of:", ["Newton", "Newton/metre", "No units (dimensionless)", "Metre"], 2, "It is a ratio of two forces, hence dimensionless."),
    q("According to the laws of dry friction, the friction force is independent of the:", ["Normal reaction", "Nature of the surfaces", "Apparent area of contact", "Coefficient of friction"], 2, "Dry (Coulomb) friction is independent of the apparent contact area."),
    q("Kinetic (dynamic) friction is ___ limiting friction.", ["Greater than", "Less than", "Equal to", "Twice"], 1, "It takes more force to start motion than to maintain it, so kinetic friction < limiting friction."),
    q("The angle of repose is ___ the angle of friction.", ["Greater than", "Less than", "Equal to", "Half of"], 2, "The angle of repose equals the angle of friction (tan of each = μ)."),
    q("A body of mass 20 kg rests on a horizontal surface with μ = 0.3 (g = 10 m/s²). The horizontal force to just move it is:", ["6 N", "60 N", "600 N", "200 N"], 1, "F = μ·m·g = 0.3 × 20 × 10 = 60 N."),
    q("The normal reaction on a body is 400 N and μ = 0.25. The limiting friction is:", ["16 N", "100 N", "1600 N", "40 N"], 1, "F = μ·N = 0.25 × 400 = 100 N."),
    q("If μ = 0.577, the angle of friction is about:", ["15°", "30°", "45°", "60°"], 1, "φ = tan⁻¹(0.577) ≈ 30°."),
    q("A body placed on a rough inclined plane begins to slide down on its own when the inclination just exceeds the:", ["Angle of friction/repose", "Right angle", "Angle of twist", "Angle of lap"], 0, "Sliding begins when the incline angle exceeds the angle of repose (= angle of friction)."),
    q("A block of weight 100 N rests on a 30° incline. The component of weight along the incline is:", ["50 N", "86.6 N", "100 N", "30 N"], 0, "Component along the incline = W·sin 30° = 100 × 0.5 = 50 N."),
    q("For the same block on the 30° incline, the normal reaction is:", ["50 N", "86.6 N", "100 N", "30 N"], 1, "Normal reaction = W·cos 30° = 100 × 0.866 = 86.6 N."),
    q("For a body on the verge of sliding down a rough plane inclined at the angle of repose α:", ["μ = sin α", "μ = tan α", "μ = cos α", "μ = 1/α"], 1, "At the angle of repose μ = tan α."),
    q("Rolling friction is ___ sliding friction for the same load.", ["Much greater than", "Much less than", "Equal to", "Unrelated to"], 1, "Rolling friction is much smaller than sliding friction — hence wheels and rollers."),
    q("In belt friction, the tensions are related by T₁/T₂ = e^(μθ), where θ is the angle of:", ["Friction", "Lap (contact) in radians", "Repose", "Twist"], 1, "θ is the angle of lap (wrap) of the belt on the pulley, in radians."),
    q("The cone of friction has a semi-vertical angle equal to the:", ["Angle of repose only", "Angle of friction", "Right angle", "Angle of lap"], 1, "The cone of friction is generated with a semi-vertical angle equal to the angle of friction φ."),
    q("In a ladder-friction problem with both surfaces rough, friction is considered at the:", ["Floor only", "Wall only", "Both the floor and the wall", "Neither"], 2, "When both contacts are rough, friction acts at both the floor and the wall."),
    q("Applying the effort at an angle above the horizontal (a pull) ___ the normal reaction.", ["Increases", "Reduces", "Does not affect", "Doubles"], 1, "An upward-inclined pull has a vertical component that reduces the normal reaction (and hence friction)."),
    q("Applying the effort as a downward push at an angle ___ the normal reaction.", ["Reduces", "Increases", "Does not affect", "Halves"], 1, "A downward-inclined push adds to the normal reaction, increasing friction."),
    q("Static friction is:", ["Constant", "Self-adjusting up to the limiting value", "Always greater than the applied force", "Zero for a body at rest"], 1, "Static friction adjusts itself to match the applied force, up to the limiting value."),
    q("A body of weight 500 N just begins to move under a horizontal force of 150 N. The coefficient of friction is:", ["0.15", "0.30", "0.60", "3.0"], 1, "On a horizontal surface N = W, so μ = F/W = 150/500 = 0.30."),
    q("If the angle of friction is 45°, the coefficient of friction is:", ["0.5", "1.0", "1.5", "0.707"], 1, "μ = tan 45° = 1."),
    q("The force of friction depends on the:", ["Colour of the body", "Nature (roughness) of the surfaces in contact", "Time of day", "Volume of the body"], 1, "Friction depends on the normal reaction and the roughness/nature of the contacting surfaces."),
];

// Chapter C — Dynamics: Kinematics & Kinetics (25)
const C_DYNAMICS = [
    q("Velocity is defined as the rate of change of:", ["Speed", "Displacement", "Acceleration", "Force"], 1, "Velocity = rate of change of displacement (a vector)."),
    q("Acceleration is defined as the rate of change of:", ["Displacement", "Velocity", "Force", "Momentum"], 1, "Acceleration = rate of change of velocity."),
    q("The first equation of motion for uniform acceleration is:", ["v = u + at", "s = ut + ½at²", "v² = u² + 2as", "s = vt"], 0, "v = u + at relates final velocity, initial velocity, acceleration and time."),
    q("The equation s = ut + ½at² gives the:", ["Final velocity", "Displacement in time t", "Acceleration", "Average speed"], 1, "It gives the displacement covered in time t under uniform acceleration."),
    q("The time-independent equation of motion is:", ["v = u + at", "s = ut + ½at²", "v² = u² + 2as", "a = v/t"], 2, "v² = u² + 2as does not contain time."),
    q("A body starts from rest and accelerates uniformly at 4 m/s² for 6 s. Its final velocity is:", ["10 m/s", "24 m/s", "1.5 m/s", "12 m/s"], 1, "v = u + at = 0 + 4 × 6 = 24 m/s."),
    q("For the same body (from rest, a = 4 m/s², t = 6 s), the distance travelled is:", ["24 m", "72 m", "144 m", "36 m"], 1, "s = ut + ½at² = 0 + ½ × 4 × 6² = ½ × 4 × 36 = 72 m."),
    q("A car moving at 30 m/s is brought to rest in 6 s. Its retardation is:", ["5 m/s²", "180 m/s²", "0.2 m/s²", "36 m/s²"], 0, "a = (v − u)/t = (0 − 30)/6 = −5 m/s²; retardation = 5 m/s²."),
    q("Newton's first law of motion is also called the law of:", ["Inertia", "Acceleration", "Action-reaction", "Gravitation"], 0, "The first law (a body stays at rest or in uniform motion unless acted on by a force) is the law of inertia."),
    q("Newton's second law of motion gives the relation:", ["F = m/a", "F = ma", "F = m + a", "F = a/m"], 1, "Force = mass × acceleration (F = ma)."),
    q("A force of 20 N acts on a 5 kg body. The acceleration produced is:", ["100 m/s²", "4 m/s²", "0.25 m/s²", "25 m/s²"], 1, "a = F/m = 20/5 = 4 m/s²."),
    q("Newton's third law states that to every action there is an equal and:", ["Larger reaction", "Opposite reaction", "Delayed reaction", "Smaller reaction"], 1, "Action and reaction are equal in magnitude and opposite in direction."),
    q("The momentum of a body is the product of its mass and:", ["Acceleration", "Velocity", "Displacement", "Force"], 1, "Momentum = mass × velocity (units kg·m/s)."),
    q("Impulse of a force equals the:", ["Change in momentum", "Change in displacement", "Change in mass", "Work done"], 0, "Impulse = force × time = change in momentum."),
    q("A 2 kg body is accelerated from 5 m/s to 15 m/s. The change in its momentum is:", ["10 kg·m/s", "20 kg·m/s", "30 kg·m/s", "40 kg·m/s"], 1, "Δp = m(v − u) = 2 × (15 − 5) = 20 kg·m/s."),
    q("D'Alembert's principle reduces a dynamics problem to a statics one by introducing a(n):", ["Extra couple", "Inertia force equal to −ma", "Friction force", "Normal reaction"], 1, "Adding the inertia force (−ma) puts the body into a state of dynamic equilibrium."),
    q("Neglecting air resistance, the trajectory of a projectile is a:", ["Circle", "Parabola", "Straight line", "Spiral"], 1, "A projectile moves in a parabolic path."),
    q("The horizontal range of a projectile is maximum at a projection angle of:", ["30°", "45°", "60°", "75°"], 1, "Range is maximum at 45°."),
    q("A ball is thrown vertically upward at 30 m/s (g = 10 m/s²). The maximum height reached is:", ["30 m", "45 m", "60 m", "90 m"], 1, "H = u²/(2g) = 30²/(2 × 10) = 900/20 = 45 m."),
    q("For that ball (u = 30 m/s, g = 10 m/s²), the time to reach the highest point is:", ["1.5 s", "3 s", "6 s", "9 s"], 1, "t = u/g = 30/10 = 3 s."),
    q("The work-energy principle equates the work done by the resultant force to the change in:", ["Momentum", "Kinetic energy", "Mass", "Volume"], 1, "Work done by the resultant force = change in kinetic energy."),
    q("The kinetic energy of a 4 kg body moving at 5 m/s is:", ["20 J", "50 J", "100 J", "10 J"], 1, "KE = ½·m·v² = ½ × 4 × 25 = 50 J."),
    q("The standard value of acceleration due to gravity is about:", ["8.91 m/s²", "9.81 m/s²", "10.8 m/s²", "6.67 m/s²"], 1, "g ≈ 9.81 m/s² at the Earth's surface."),
    q("A body falls freely from rest. The distance covered in the first 2 s (g = 10 m/s²) is:", ["10 m", "20 m", "40 m", "5 m"], 1, "s = ½·g·t² = ½ × 10 × 2² = ½ × 10 × 4 = 20 m."),
    q("The recoil of a gun when a bullet is fired is explained by the conservation of:", ["Energy", "Momentum", "Mass", "Friction"], 1, "The equal and opposite momenta of bullet and gun conserve total momentum (initially zero)."),
];

// Chapter D — Centroid, Moment of Inertia & Trusses (25)
const C_MOI_TRUSS = [
    q("The centroid of a triangle lies above its base at a height of:", ["h/2", "h/3", "h/4", "2h/3"], 1, "The centroid of a triangle is at h/3 from the base."),
    q("The centroid of a semicircular area of radius r, from its diameter, is at:", ["r/2", "4r/3π", "3r/8", "2r/π"], 1, "For a semicircular area the centroid is 4r/3π from the diameter."),
    q("The moment of inertia of a rectangle (width b, depth d) about the centroidal axis parallel to the width is:", ["bd³/3", "bd³/12", "db³/12", "bd²/6"], 1, "I = bd³/12 about the centroidal axis parallel to the width."),
    q("The moment of inertia of a rectangle about an axis along its base is:", ["bd³/3", "bd³/12", "bd³/36", "db³/12"], 0, "About the base I = bd³/3 (by the parallel-axis theorem from the centroid)."),
    q("The moment of inertia of a circular section of diameter d about a diameter is:", ["πd⁴/32", "πd⁴/64", "πd³/32", "πd⁴/16"], 1, "I = πd⁴/64 about a diametral axis."),
    q("The polar moment of inertia of a solid circular section of diameter d is:", ["πd⁴/16", "πd⁴/32", "πd⁴/64", "πd⁴/8"], 1, "J = πd⁴/32 for a solid circular section (= 2 × the diametral I)."),
    q("The parallel axis theorem is written as:", ["I = I_G − Ah²", "I = I_G + Ah²", "I = I_G + Ah", "I = I_G/Ah²"], 1, "I = I_G + Ah², where A is the area and h the distance between the parallel axes."),
    q("The perpendicular axis theorem states that:", ["I_zz = I_xx − I_yy", "I_zz = I_xx + I_yy", "I_zz = I_xx × I_yy", "I_zz = I_xx / I_yy"], 1, "The polar MI equals the sum of the two rectangular MIs: I_zz = I_xx + I_yy."),
    q("The radius of gyration k is given by:", ["k = I/A", "k = √(I/A)", "k = A/I", "k = √(A/I)"], 1, "I = A·k² ⇒ k = √(I/A)."),
    q("The unit of the area moment of inertia is:", ["m²", "m³", "m⁴", "m"], 2, "Area MI has dimensions of length⁴ (e.g. mm⁴, m⁴)."),
    q("The moment of inertia of a triangular section about its base is:", ["bh³/12", "bh³/36", "bh³/3", "bh³/4"], 0, "About the base I = bh³/12; about the centroidal axis it is bh³/36."),
    q("The moment of inertia of a triangular section about its centroidal axis (parallel to the base) is:", ["bh³/12", "bh³/36", "bh³/3", "bh³/4"], 1, "About the centroid I = bh³/36."),
    q("A rectangle is 40 mm wide and 60 mm deep. Its moment of inertia about the centroidal axis parallel to the width (bd³/12) is:", ["720000 mm⁴", "360000 mm⁴", "1440000 mm⁴", "240000 mm⁴"], 0, "I = 40 × 60³/12 = 40 × 216000/12 = 8640000/12 = 720000 mm⁴."),
    q("The radius of gyration of a rectangular section of depth d about its centroidal axis (parallel to the width) is:", ["d/2", "d/√12", "d/3", "d/√3"], 1, "k = √(I/A) = √((bd³/12)/(bd)) = √(d²/12) = d/√12."),
    q("The moment of inertia of a section is a measure of its resistance to:", ["Axial load", "Bending", "Temperature", "Corrosion"], 1, "A larger area moment of inertia means greater resistance to bending."),
    q("A perfect plane truss with j joints and m members satisfies:", ["m = 2j − 3", "m = j − 2", "m = 3j − 2", "m = 2j + 3"], 0, "The perfect-truss relation is m = 2j − 3."),
    q("A plane truss has 6 joints. To be a perfect truss it must have:", ["8 members", "9 members", "12 members", "6 members"], 1, "m = 2j − 3 = 2 × 6 − 3 = 9 members."),
    q("The method of joints analyses a truss by applying, at each joint:", ["ΣM = 0 only", "ΣH = 0 and ΣV = 0", "The bending equation", "Hooke's law"], 1, "Each joint is a concurrent-force system in equilibrium: ΣH = 0 and ΣV = 0."),
    q("To find the force in one particular member directly, one uses the method of:", ["Joints", "Sections", "Superposition", "Virtual work"], 1, "The method of sections cuts through the member to expose its force directly."),
    q("The members of an ideal (pin-jointed) truss carry only:", ["Bending moments", "Axial forces (tension or compression)", "Shear forces", "Torsion"], 1, "Truss members are two-force members carrying purely axial force."),
    q("A truss member that is being stretched (pulled) is said to be in:", ["Compression", "Tension", "Shear", "Torsion"], 1, "A member being pulled/stretched carries tension."),
    q("A truss member that is being shortened (pushed) is said to be in:", ["Tension", "Compression", "Bending", "Shear"], 1, "A member being pushed/shortened carries compression."),
    q("In truss analysis, the external loads are assumed to act only at the:", ["Mid-span of members", "Joints", "Supports only", "Centroid of the truss"], 1, "Loads are applied at the joints so members remain two-force (axial-only) members."),
    q("A truss having more members than required for a perfect truss is called:", ["Perfect", "Deficient", "Redundant (imperfect)", "Simple"], 2, "More members than 2j − 3 makes it a redundant (over-stiff, statically indeterminate) truss."),
    q("The centre of gravity of a solid hemisphere of radius r lies from its flat face at:", ["r/2", "3r/8", "4r/3π", "3r/4"], 1, "For a solid hemisphere the CG is 3r/8 from the flat base."),
];

const TESTS = [
    // Topic-wise Quick Shots (10 each)
    { slug: "resultant", topic: "Resultant of Forces", title: "Mechanics: Resultant of Forces — Topic Drill", format: "quick-shot", questions: T_RESULTANT, blurb: "10-question topic drill on the resultant of forces — parallelogram & triangle laws, resolution into components and resultant numericals. LEET exam-focused; answers reveal as you go." },
    { slug: "moment-couple", topic: "Moment & Couple", title: "Mechanics: Moment & Couple — Topic Drill", format: "quick-shot", questions: T_MOMENT, blurb: "10-question topic drill on the moment of a force and couples — Varignon's theorem, moment numericals and the properties of a couple." },
    { slug: "centroid", topic: "Centre of Gravity", title: "Mechanics: Centre of Gravity & Centroid — Topic Drill", format: "quick-shot", questions: T_CENTROID, blurb: "10-question topic drill on centre of gravity and centroids — standard shapes, the method of moments and axis-of-symmetry facts." },
    { slug: "projectile", topic: "Projectile Motion", title: "Mechanics: Projectile Motion — Topic Drill", format: "quick-shot", questions: T_PROJECTILE, blurb: "10-question topic drill on projectile motion — time of flight, maximum height, range and the 45° maximum-range result, with worked numericals." },
    { slug: "work-energy", topic: "Work, Power & Energy", title: "Mechanics: Work, Power & Energy — Topic Drill", format: "quick-shot", questions: T_WORK, blurb: "10-question topic drill on work, power and energy — the work-energy principle, kinetic & potential energy and power numericals." },
    // Chapter-wise sets (25 each)
    { slug: "statics-chapter", topic: "Statics: Forces & Equilibrium", title: "Mechanics: Statics — Force Systems & Equilibrium (Chapter Test)", format: "practice", questions: C_STATICS, blurb: "25-question chapter test on statics — force systems, resolution, moments & couples, equilibrium conditions, Lami's theorem and the triangle/polygon laws." },
    { slug: "friction-chapter", topic: "Friction", title: "Mechanics: Friction (Chapter Test)", format: "practice", questions: C_FRICTION, blurb: "25-question chapter test on friction — laws of dry friction, coefficient & angle of friction, angle of repose, inclined planes, belt & ladder friction, with numericals." },
    { slug: "dynamics-chapter", topic: "Dynamics: Kinematics & Kinetics", title: "Mechanics: Dynamics — Kinematics & Kinetics (Chapter Test)", format: "practice", questions: C_DYNAMICS, blurb: "25-question chapter test on dynamics — equations of motion, projectiles, Newton's laws, momentum & impulse, D'Alembert's principle and the work-energy principle." },
    { slug: "moi-truss-chapter", topic: "Centroid, MI & Trusses", title: "Mechanics: Centroid, Moment of Inertia & Trusses (Chapter Test)", format: "practice", questions: C_MOI_TRUSS, blurb: "25-question chapter test on centroids, area moment of inertia (axis theorems, radius of gyration, standard formulae) and plane trusses (perfect trusses, method of joints/sections)." },
];

// Publish each set once (per-test SeedFlag), as repeatable practice attributed to
// an admin. Quick Shots lock to 10 questions; the 25-question chapter sets use the
// "practice" format (locked count 25).
async function ensureMechanicsExamTestsSeeded() {
    try {
        const owner =
            (await User.findOne({ role: { $in: ["superadmin", "admin"] } }).sort({ createdAt: 1 }).select("_id").lean()) ||
            (await User.findOne().sort({ createdAt: 1 }).select("_id").lean());
        if (!owner) {
            console.warn("[mechanics-exam] no user to attribute yet; will publish on a later boot");
            return;
        }

        for (const t of TESTS) {
            const key = `mechanics-exam-${t.slug}-v1`;
            if (await SeedFlag.exists({ key })) continue;

            // Fixed-format sets must match their locked count.
            if (t.format && TEST_FORMATS[t.format] && t.questions.length !== TEST_FORMATS[t.format].count) {
                console.warn(`[mechanics-exam] ${t.topic} has ${t.questions.length}, expected ${TEST_FORMATS[t.format].count} — skipped`);
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
            console.log(`[mechanics-exam] published ${t.title} (${docs.length} Q)`);
        }
    } catch (e) {
        console.warn("[mechanics-exam] seed skipped:", e.message);
    }
}

module.exports = {
    T_RESULTANT,
    T_MOMENT,
    T_CENTROID,
    T_PROJECTILE,
    T_WORK,
    C_STATICS,
    C_FRICTION,
    C_DYNAMICS,
    C_MOI_TRUSS,
    TESTS,
    ensureMechanicsExamTestsSeeded,
};
