import { AcademicLevel } from '../types/course';

export interface SyllabusTemplate {
  id: string;
  code: string;
  title: string;
  discipline: string;
  academicLevel: AcademicLevel;
  description: string;
  modules: Array<{
    weekLabel: string;
    title: string;
    summary: string;
    objectives: string[];
    estimatedReadMinutes: number;
  }>;
}

export const SYLLABUS_TEMPLATES: SyllabusTemplate[] = [
  {
    id: 'cs-ml-foundations',
    code: 'CS 229',
    title: 'Foundations of Statistical Machine Learning',
    discipline: 'Computer Science',
    academicLevel: 'Advanced / Graduate',
    description:
      'Rigorous introduction to supervised learning, optimization theory, probabilistic models, generalization bounds, and modern neural architectures.',
    modules: [
      {
        weekLabel: 'Week 01',
        title: 'Supervised Learning & Empirical Risk Minimization',
        summary:
          'Hypothesis spaces, loss functions, ordinary least squares, and the statistical foundation of empirical risk minimization.',
        objectives: [
          'Formulate regression and classification as optimization over parameterized hypothesis classes',
          'Derive the normal equations and gradient descent update rules for linear models',
          'Contrast empirical risk with true population risk',
        ],
        estimatedReadMinutes: 18,
      },
      {
        weekLabel: 'Week 02',
        title: 'Probabilistic Interpretations, Logistic Regression & GLMs',
        summary:
          'Maximum likelihood estimation, exponential family distributions, generalized linear models, and Newton-Raphson optimization.',
        objectives: [
          'Connect squared loss and cross-entropy loss to Gaussian and Bernoulli likelihoods',
          'Derive the gradient and Hessian for binary logistic regression',
          'Construct generalized linear models from canonical link functions',
        ],
        estimatedReadMinutes: 20,
      },
      {
        weekLabel: 'Week 03',
        title: 'Bias-Variance Trade-Off & Regularization Theory',
        summary:
          'Decomposing prediction error, Ridge and Lasso shrinkage estimators, and cross-validation model selection.',
        objectives: [
          'Prove the bias-variance decomposition under squared error loss',
          'Analyze the geometric sparsity induced by L1 vs L2 penalties',
          'Design leak-free K-fold cross-validation protocols',
        ],
        estimatedReadMinutes: 16,
      },
      {
        weekLabel: 'Week 04',
        title: 'Kernel Methods & Support Vector Machines',
        summary:
          'Maximum-margin hyperplanes, Lagrange duality, KKT conditions, and reproducing kernel Hilbert spaces.',
        objectives: [
          'Formulate primal and dual optimization problems for soft-margin SVMs',
          'Apply Mercer’s theorem to evaluate valid kernel functions',
          'Interpret support vectors and margin slack variables geometrically',
        ],
        estimatedReadMinutes: 22,
      },
      {
        weekLabel: 'Week 05',
        title: 'Deep Neural Networks & Backpropagation',
        summary:
          'Universal approximation, automatic differentiation, vanishing gradients, normalization layers, and residual connections.',
        objectives: [
          'Derive reverse-mode automatic differentiation for multi-layer perceptrons',
          'Diagnose gradient pathology across deep computational graphs',
          'Explain how skip connections and layer normalization stabilize training',
        ],
        estimatedReadMinutes: 20,
      },
    ],
  },
  {
    id: 'econ-macro-policy',
    code: 'ECON 204',
    title: 'Modern Macroeconomics & Monetary Policy',
    discipline: 'Economics',
    academicLevel: 'Intermediate Undergraduate',
    description:
      'Analysis of national income accounting, long-run growth models, business cycle fluctuations, inflation expectations, and central bank policy rules.',
    modules: [
      {
        weekLabel: 'Module 01',
        title: 'National Income Accounting & Aggregate Demand',
        summary:
          'GDP measurement, real vs. nominal output, income-expenditure identity, and fiscal multiplier mechanics.',
        objectives: [
          'Reconcile expenditure, income, and value-added measures of output',
          'Compute Keynesian spending and tax multipliers algebraically',
          'Distinguish cyclical deficits from structural fiscal balances',
        ],
        estimatedReadMinutes: 15,
      },
      {
        weekLabel: 'Module 02',
        title: 'The Solow-Swan Growth Model & Productivity',
        summary:
          'Capital accumulation, steady-state dynamics, Golden Rule savings, and total factor productivity growth.',
        objectives: [
          'Solve for steady-state capital per effective worker',
          'Predict transitional dynamics after savings or population shocks',
          'Evaluate why sustained per-capita growth requires technological progress',
        ],
        estimatedReadMinutes: 18,
      },
      {
        weekLabel: 'Module 03',
        title: 'IS-LM, Monetary Transmission & the Zero Lower Bound',
        summary:
          'Liquidity preference, interest rate channels, open-market operations, and unconventional quantitative easing.',
        objectives: [
          'Model simultaneous equilibrium in goods and money markets',
          'Trace monetary transmission through investment, exchange rates, and asset prices',
          'Analyze liquidity traps and forward guidance when nominal rates hit zero',
        ],
        estimatedReadMinutes: 19,
      },
      {
        weekLabel: 'Module 04',
        title: 'Phillips Curve, Expectations & Taylor Rules',
        summary:
          'Inflation-unemployment trade-offs, adaptive vs. rational expectations, time inconsistency, and central bank credibility.',
        objectives: [
          'Explain why the long-run Phillips curve is vertical at the natural rate',
          'Apply the Taylor Rule to evaluate interest rate policy stances',
          'Evaluate the inflation bias in discretionary monetary regimes',
        ],
        estimatedReadMinutes: 17,
      },
    ],
  },
  {
    id: 'bio-cell-molecular',
    code: 'BIO 110',
    title: 'Cellular & Molecular Biology',
    discipline: 'Biology',
    academicLevel: 'Introductory Undergraduate',
    description:
      'Exploration of biomolecular structure, membrane transport, cellular bioenergetics, DNA replication, gene regulation, and signal transduction.',
    modules: [
      {
        weekLabel: 'Unit 01',
        title: 'Macromolecular Architecture & Protein Folding',
        summary:
          'Non-covalent interactions, amino acid chemistry, hierarchical protein structure, and allosteric regulation.',
        objectives: [
          'Predict how side-chain polarity drives tertiary folding in aqueous environments',
          'Distinguish primary, secondary, tertiary, and quaternary structural motifs',
          'Explain cooperative binding and allosteric inhibition in enzymes',
        ],
        estimatedReadMinutes: 16,
      },
      {
        weekLabel: 'Unit 02',
        title: 'Biological Membranes & Active Transport',
        summary:
          'Fluid mosaic lipid bilayers, electrochemical gradients, ion channels, and ATP-driven pumps.',
        objectives: [
          'Calculate membrane potential direction using concentration gradients',
          'Compare passive diffusion, facilitated transport, and secondary active cotransport',
          'Trace the catalytic cycle of the Na+/K+-ATPase pump',
        ],
        estimatedReadMinutes: 17,
      },
      {
        weekLabel: 'Unit 03',
        title: 'Cellular Respiration & Chemiosmotic Coupling',
        summary:
          'Glycolysis, citric acid cycle, mitochondrial electron transport chain, and rotary ATP synthase.',
        objectives: [
          'Account for NADH, FADH2, and substrate-level ATP yields across pathways',
          'Explain how proton motive force drives conformational ATP synthesis',
          'Analyze metabolic regulation at phosphofructokinase and pyruvate dehydrogenase',
        ],
        estimatedReadMinutes: 20,
      },
      {
        weekLabel: 'Unit 04',
        title: 'Central Dogma: Transcription, Splicing & Gene Control',
        summary:
          'Chromatin remodeling, RNA polymerase initiation, alternative splicing, and operon/enhancer regulation.',
        objectives: [
          'Compare prokaryotic operon control with eukaryotic enhancer-promoter looping',
          'Trace pre-mRNA capping, polyadenylation, and spliceosome assembly',
          'Explain how epigenetic histone modifications alter transcriptional accessibility',
        ],
        estimatedReadMinutes: 18,
      },
    ],
  },
  {
    id: 'law-constitutional',
    code: 'LAW 201',
    title: 'Constitutional Structure & Civil Liberties',
    discipline: 'Law & Political Theory',
    academicLevel: 'Intermediate Undergraduate',
    description:
      'Doctrinal and philosophical examination of separation of powers, federalism, judicial review, due process, and equal protection.',
    modules: [
      {
        weekLabel: 'Week 01',
        title: 'Judicial Review & Constitutional Interpretation',
        summary:
          'Origins of judicial supremacy, text, history, pragmatism, and institutional legitimacy.',
        objectives: [
          'Analyze the structural logic of Marbury v. Madison',
          'Contrast originalist, living-constitutionalist, and structural interpretive methods',
          'Evaluate political question doctrine and standing limits',
        ],
        estimatedReadMinutes: 18,
      },
      {
        weekLabel: 'Week 02',
        title: 'Separation of Powers & the Administrative State',
        summary:
          'Executive authority, non-delegation doctrine, Youngstown framework, and agency rulemaking.',
        objectives: [
          'Apply Justice Jackson’s tripartite framework to executive-congressional conflicts',
          'Trace the evolution of statutory deference and major questions doctrine',
          'Assess bicameralism and presentment constraints on legislative vetoes',
        ],
        estimatedReadMinutes: 19,
      },
      {
        weekLabel: 'Week 03',
        title: 'Federalism, Commerce Power & Preemption',
        summary:
          'Enumerated national powers, Tenth Amendment sovereignty, dormant commerce limits, and supremacy preemption.',
        objectives: [
          'Synthesize doctrinal tests governing interstate commerce regulation',
          'Distinguish express, field, and obstacle preemption',
          'Evaluate anti-commandeering boundaries on federal-state cooperation',
        ],
        estimatedReadMinutes: 17,
      },
      {
        weekLabel: 'Week 04',
        title: 'Due Process, Equal Protection & Tiers of Scrutiny',
        summary:
          'Procedural safeguards, substantive liberty rights, suspect classifications, and proportionality review.',
        objectives: [
          'Apply rational basis, intermediate, and strict scrutiny frameworks',
          'Compare procedural due process balancing with substantive fundamental rights',
          'Analyze landmark equal protection cases across race and sex classifications',
        ],
        estimatedReadMinutes: 20,
      },
    ],
  },
  {
    id: 'phys-mechanics-thermo',
    code: 'PHYS 140',
    title: 'Analytical Mechanics & Thermodynamics',
    discipline: 'Physics',
    academicLevel: 'Intermediate Undergraduate',
    description:
      'From Newtonian conservation laws and Lagrangian variational principles to statistical entropy and thermodynamic cycles.',
    modules: [
      {
        weekLabel: 'Chapter 01',
        title: 'Conservation Laws, Momentum & Central Force Orbits',
        summary:
          'Symmetries, angular momentum conservation, effective potentials, and Keplerian orbital mechanics.',
        objectives: [
          'Derive energy and angular momentum conservation from central force equations',
          'Sketch and classify bounded vs. unbounded trajectories via effective potential',
          'Prove Kepler’s laws from inverse-square gravitation',
        ],
        estimatedReadMinutes: 18,
      },
      {
        weekLabel: 'Chapter 02',
        title: 'Calculus of Variations & Lagrangian Mechanics',
        summary:
          'Principle of least action, Euler-Lagrange equations, generalized coordinates, and Noether’s theorem.',
        objectives: [
          'Derive the Euler-Lagrange equations from Hamilton’s variational principle',
          'Solve constrained multi-body systems using generalized coordinates',
          'Identify conserved quantities from continuous coordinate symmetries',
        ],
        estimatedReadMinutes: 21,
      },
      {
        weekLabel: 'Chapter 03',
        title: 'First & Second Laws of Thermodynamics',
        summary:
          'Internal energy, reversible vs. irreversible processes, Carnot efficiency, and Clausius entropy.',
        objectives: [
          'Compute work and heat transfers along isothermal and adiabatic paths',
          'Prove that no heat engine exceeds Carnot efficiency between two reservoirs',
          'Evaluate entropy changes for irreversible free expansion and mixing',
        ],
        estimatedReadMinutes: 17,
      },
      {
        weekLabel: 'Chapter 04',
        title: 'Boltzmann Entropy & Statistical Ensembles',
        summary:
          'Microstates, multiplicity, canonical Boltzmann factor, equipartition theorem, and partition functions.',
        objectives: [
          'Connect macroscopic temperature and pressure to statistical multiplicity',
          'Compute thermodynamic averages from the canonical partition function',
          'Explain heat capacity anomalies where equipartition breaks down',
        ],
        estimatedReadMinutes: 20,
      },
    ],
  },
];
