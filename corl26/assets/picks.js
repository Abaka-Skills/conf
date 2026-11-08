// Curated "Picks" layer: topic rules + a short hand-picked list.
// Topic labels only — matched against event titles, groups and tags at load time.
// Edit freely; nothing here is scraped.
const TOPICS = [
 {id:'dex',  label:'Dexterous hands & tactile', color:'#e0a458',
  re:/dexter|in-hand|multi-?finger|fingertip|tactile|visuo-?tactile|\bhands?\b|glove/i},
 {id:'data', label:'Teleop, corrections & data flywheel', color:'#5ad1c8',
  re:/teleop|intervention|correction|dagger|human-in-the-loop|data collection|data-collection|data curation|failure|recover|retry|self-improv|flywheel|\bumi\b|imperfect data|oops|deploy|data infrastructure/i},
 {id:'sys',  label:'Agentic robotics & Sys1/Sys2', color:'#b39ddb',
  re:/agentic|\bagents?\b|harness|coding agent|llm|vlm|language model|task planning|reasoning|dual-system|system[- ]?[12]\b|slow-fast|fast[- ]slow|fast and slow|timescale|hierarch|asynchronous|streaming action|key-action|test-time compute|steering pretrained|world action model/i,
  not:/driving|driver|navigation|anomaly/i},
 {id:'rl',   label:'RL (sim & real-world)', color:'#81c784',
  re:/reinforcement|\brl\b|sim-to-real|sim2real|real2sim|residual rl|policy optimization|q-?learning|offline-to-online/i,
  not:/driving|spacecraft/i},
 {id:'comp', label:'Compliance & force control', color:'#f48fb1',
  re:/complian|impedance|admittance|torque|\bforce\b|force-|forceful|backdriv|tendon|stiffness|contact-rich|actuator network/i,
  not:/socially compliant|compliance evaluation|group-structural/i},
 {id:'hum',  label:'Humanoid & whole-body', color:'#90caf9',
  re:/humanoid|whole-?body|loco-?manip|motion tracking|retarget/i},
];

// Top picks: title prefixes (case-insensitive). Every entry should match at least one event.
const TOP_PICKS = [
 // agentic robotics & Sys1/Sys2: reasoning layer on top of a fast policy
 'Early Career Keynote I · Hang Zhao', 'MolmoAct2: Action Reasoning', 'H-VLA:', 'HAF-VLA:', 'FlashVLA:', 'AsyncVLA:',
 'REACT: Rolling Denoising', 'DIRECT: When and Where', 'VLS: Steering Pretrained', 'Hierarchical Planning with Latent World Models',
 'Scaling World Model for Hierarchical', 'NVIDIA: From Dreaming to Doing', 'Boston Dynamics: Actions and Agents',
 'Demo 4: Beyond Demonstrations', 'Workshop on Agentic Robotics', 'Efficient Foundation Models for Real-Time Embodied AI',
 // corrections, interventions, data flywheel
 'FlowDAgger:', 'How to Learn from What a Human Would Avoid', 'GUILD:', 'Learning While Deploying', 'RoboPocket:', 'TUTOR:',
 'UniIntervene:', 'PACER:', 'FAR: Failure-Aware Retry', 'Learning from Corrections and Interventions', 'Learn@Deploy',
 'Continually Self-Improving Robots', '"Oops, I Erred"', 'Everything Beneath the Policy', 'The UMI Olympics', 'Scaling H2R',
 'Keynote II · Russ Tedrake', 'Early Career Keynote III · Roberto Martin-Martin',
 // dexterous hands, teleop, tactile
 'AnyDexRT:', 'Towards Human-level Dexterous Teleoperation', 'YOCO:', 'Play2Perfect:', 'HiFun:', 'A Minimalist Retargeting-Guided',
 'ADEPT:', 'OmniTacTune:', '3rd Workshop on Dexterous Manipulation', 'BiDexTool:', 'From Human Videos to Dexterous Robot Capability',
 'Demo 9: ART-Glove', 'Demo 13: FlexiTac', 'Demo 14: DexMixer', 'Demo 15: MiTaS', 'Sharpa: Scaling Robotic Dexterity',
 // compliance / force / actuation
 'Sim-to-Real Transfer for Muscle-Actuated Robots', 'Do Rigid-Body Simulators Dream of Soft Robots', 'Current as Touch:',
 'CompVLA:', 'TDC: Sim-to-Real Transferable Directional Compliance', 'CHIP: Adaptive Compliance', 'Learning Functional Compliance',
 'Universal Manipulation Exoskeleton', 'Constraint-Decomposed Impedance Control', 'Hardware-as-Regularization', 'FACTR 2:',
 'Never Too Late for Force', 'Open Problems in Contact-Rich Loco-Manipulation',
 // RL
 'R2RL:', 'Object-Centric Residual RL', 'Beyond Imitation: Reinforcement Learning-Based Sim-Real', 'Scaling Sim-to-Real VLA Reinforcement',
 'EXPO-FT:', 'Preference-Calibrated Human-in-the-Loop',
 // humanoid
 'SuperMimic:', 'GRAIL:', 'General Humanoid Whole-Body Control via Pretraining',
];

// Exhibitor picks: booth numbers (see exhibitors.js); others count as topic matches via their categories.
const TOP_BOOTHS = [400, 504, 205, 410, 200, 100, 508, 204, 500, 104, 502, 103];
