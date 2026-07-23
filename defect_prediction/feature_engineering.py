import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import numpy as np
import pandas as pd
from defect_prediction.utils import logger

def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Applies feature engineering to the software defect dataset.
    Creates domain-relevant software engineering ratios and non-linear transformations.
    
    IMPORTANT:
    - Target column ('defect') is strictly excluded from all feature calculations.
    - No target-derived features (such as past_defects ratios that leak target decision logic) are generated.
    """
    logger.info("Executing Feature Engineering...")
    df_feat = df.copy()
    
    # 1. Size & Complexity Ratios
    if 'lines_of_code' in df_feat and 'num_functions' in df_feat:
        df_feat['loc_per_function'] = df_feat['lines_of_code'] / (df_feat['num_functions'] + 1e-5)
    if 'lines_of_code' in df_feat and 'num_classes' in df_feat:
        df_feat['loc_per_class'] = df_feat['lines_of_code'] / (df_feat['num_classes'] + 1e-5)
    if 'cyclomatic_complexity' in df_feat and 'lines_of_code' in df_feat:
        df_feat['complexity_density'] = df_feat['cyclomatic_complexity'] / (df_feat['lines_of_code'] + 1e-5)
    if 'cyclomatic_complexity' in df_feat and 'num_functions' in df_feat:
        df_feat['complexity_per_function'] = df_feat['cyclomatic_complexity'] / (df_feat['num_functions'] + 1e-5)

    # 2. Process & Developer Experience Metrics
    if 'bug_fix_commits' in df_feat and 'commit_frequency' in df_feat:
        df_feat['bug_fix_ratio'] = df_feat['bug_fix_commits'] / (df_feat['commit_frequency'] + 1e-5)
    if 'code_churn' in df_feat and 'commit_frequency' in df_feat:
        df_feat['churn_per_commit'] = df_feat['code_churn'] / (df_feat['commit_frequency'] + 1e-5)
    if 'code_churn' in df_feat and 'num_developers' in df_feat:
        df_feat['churn_per_developer'] = df_feat['code_churn'] / (df_feat['num_developers'] + 1e-5)
    if 'num_developers' in df_feat and 'developer_experience_years' in df_feat:
        df_feat['dev_experience_total'] = df_feat['num_developers'] * df_feat['developer_experience_years']

    # 3. Quality, Security & Testing Ratios
    if 'static_analysis_warnings' in df_feat and 'lines_of_code' in df_feat:
        df_feat['warning_density'] = df_feat['static_analysis_warnings'] / (df_feat['lines_of_code'] + 1e-5)
    if 'security_vulnerabilities' in df_feat and 'test_coverage' in df_feat:
        df_feat['security_risk_factor'] = df_feat['security_vulnerabilities'] * (1.0 - df_feat['test_coverage'])
    if 'build_failures' in df_feat and 'commit_frequency' in df_feat:
        df_feat['build_failure_rate'] = df_feat['build_failures'] / (df_feat['commit_frequency'] + 1e-5)

    # 4. Object-Oriented Metrics Interactions
    if 'coupling_between_objects' in df_feat and 'lack_of_cohesion' in df_feat:
        df_feat['coupling_cohesion_interaction'] = df_feat['coupling_between_objects'] * df_feat['lack_of_cohesion']
    if 'cyclomatic_complexity' in df_feat and 'coupling_between_objects' in df_feat:
        df_feat['complexity_coupling_interaction'] = df_feat['cyclomatic_complexity'] * df_feat['coupling_between_objects']

    # 5. Non-linear Log Transformations for Skewed Features
    for col in ['lines_of_code', 'code_churn', 'static_analysis_warnings']:
        if col in df_feat:
            df_feat[f'log_{col}'] = np.log1p(np.maximum(0, df_feat[col]))

    new_feats = [c for c in df_feat.columns if c not in df.columns]
    logger.info(f"Feature engineering completed successfully. Generated {len(new_feats)} new features: {new_feats}")
    return df_feat
