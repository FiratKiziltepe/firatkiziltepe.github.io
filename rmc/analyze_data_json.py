import pandas as pd
import json

try:
    df = pd.read_excel('Example data sets.xlsx')
    
    # Convert datetime objects to string for JSON serialization
    df_sample = df.head().copy()
    for col in df_sample.columns:
        if pd.api.types.is_datetime64_any_dtype(df_sample[col]):
            df_sample[col] = df_sample[col].dt.strftime('%Y-%m-%d')
            
    result = {
        "columns": df.columns.tolist(),
        "dtypes": {k: str(v) for k, v in df.dtypes.items()},
        "sample_data": df_sample.to_dict(orient='records')
    }
    print(json.dumps(result, indent=2))
except Exception as e:
    print(f"Error: {e}")
