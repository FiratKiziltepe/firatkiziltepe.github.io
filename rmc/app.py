import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import numpy as np

# Page Config
st.set_page_config(
    page_title="RMC Dashboard",
    page_icon="🌍",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Space+Mono:wght@400;700&display=swap');
    
    .stApp {
        background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #0d1b2a 100%);
    }
    
    .main-header {
        font-family: 'Space Mono', monospace;
        font-size: 2.5rem;
        font-weight: 700;
        background: linear-gradient(90deg, #00d4ff, #7c3aed, #f472b6);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        text-align: center;
        padding: 1rem 0;
        margin-bottom: 1rem;
    }
    
    .metric-card {
        background: linear-gradient(145deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9));
        border: 1px solid rgba(100, 116, 139, 0.3);
        border-radius: 16px;
        padding: 1.5rem;
        text-align: center;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(10px);
    }
    
    .metric-value {
        font-family: 'Space Mono', monospace;
        font-size: 2.2rem;
        font-weight: 700;
        color: #00d4ff;
        margin: 0.5rem 0;
    }
    
    .metric-label {
        font-family: 'DM Sans', sans-serif;
        font-size: 0.9rem;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 1px;
    }
    
    .section-header {
        font-family: 'DM Sans', sans-serif;
        font-size: 1.4rem;
        font-weight: 600;
        color: #e2e8f0;
        border-left: 4px solid #7c3aed;
        padding-left: 1rem;
        margin: 2rem 0 1rem 0;
    }
    
    .stSidebar {
        background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
    }
    
    .stSidebar .stSelectbox label, .stSidebar .stMultiSelect label {
        color: #e2e8f0;
        font-family: 'DM Sans', sans-serif;
    }
    
    .briefing-box {
        background: linear-gradient(145deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95));
        border: 1px solid rgba(124, 58, 237, 0.4);
        border-radius: 12px;
        padding: 2rem;
        color: #e2e8f0;
        font-family: 'DM Sans', sans-serif;
        line-height: 1.8;
    }
    
    .highlight-stat {
        color: #00d4ff;
        font-weight: 600;
    }
    
    div[data-testid="stMetricValue"] {
        font-family: 'Space Mono', monospace;
        color: #00d4ff;
    }
    
    div[data-testid="stMetricLabel"] {
        font-family: 'DM Sans', sans-serif;
        color: #94a3b8;
    }
</style>
""", unsafe_allow_html=True)

# Color palette
COLORS = {
    'primary': '#00d4ff',
    'secondary': '#7c3aed',
    'accent': '#f472b6',
    'success': '#10b981',
    'warning': '#f59e0b',
    'danger': '#ef4444',
    'background': '#0f172a',
    'card': '#1e293b',
    'text': '#e2e8f0',
    'muted': '#94a3b8'
}

COLOR_SEQUENCE = ['#00d4ff', '#7c3aed', '#f472b6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6', '#ec4899', '#14b8a6']

# Common legend style for all charts
LEGEND_STYLE = dict(
    font=dict(color='#e2e8f0', size=12),
    bgcolor='rgba(30, 41, 59, 0.9)',
    bordercolor='rgba(100, 116, 139, 0.5)',
    borderwidth=1
)

def get_base_layout(height=400, show_legend=True):
    """Base layout for all charts with proper styling"""
    layout = dict(
        plot_bgcolor='rgba(0,0,0,0)',
        paper_bgcolor='rgba(0,0,0,0)',
        font=dict(color='#e2e8f0', family='DM Sans'),
        height=height,
        legend=dict(
            **LEGEND_STYLE,
            orientation="h", 
            yanchor="bottom", 
            y=1.02, 
            xanchor="right", 
            x=1
        ) if show_legend else dict(visible=False)
    )
    return layout

# ============ DATA LOADING ============
@st.cache_data
def load_data():
    """Load all datasets from Excel file"""
    excel_file = 'data.xlsx'
    
    # Load all sheets
    example_data = pd.read_excel(excel_file, sheet_name='Example data sets')
    asylum_data = pd.read_excel(excel_file, sheet_name='Asylum claims June 25')
    homeless_data = pd.read_excel(excel_file, sheet_name='Homeless Assessments LA June 25')
    immigration_data = pd.read_excel(excel_file, sheet_name='Immigration Groups LA June 25')
    
    # Clean homeless data columns
    homeless_data.columns = [col.replace('\n', ' ').strip() for col in homeless_data.columns]
    
    # Convert numeric columns in immigration_data (some may have been read as strings)
    numeric_cols = [
        'Homes for Ukraine - not including super sponsors (arrivals)',
        'Afghan Resettlement Programme (total) (population)',
        'Supported Asylum (total) (population)',
        'All 3 pathways (total) ',
        'Population',
        'Percentage of population (%)',
        'of which, Supported Asylum - Initial Accommodation (population)',
        'of which, Supported Asylum - Dispersal Accommodation (population)',
        'of which, Supported Asylum - Contingency Accommodation (population)',
        'of which, Afghan Resettlement Programme - transitional (population)',
        'of which, Afghan Resettlement Programme - settled in LA housing (population)',
        'of which, Afghan Resettlement Programme - settled in PRS housing (population)'
    ]
    for col in numeric_cols:
        if col in immigration_data.columns:
            immigration_data[col] = pd.to_numeric(immigration_data[col], errors='coerce').fillna(0)
    
    return example_data, asylum_data, homeless_data, immigration_data

# Load data
example_data, asylum_data, homeless_data, immigration_data = load_data()

# West Midlands filter
WEST_MIDLANDS_LAS = immigration_data[immigration_data['Region / Nation'] == 'West Midlands']['Local authority'].tolist()

# ============ SIDEBAR ============
st.sidebar.markdown('<div class="main-header" style="font-size:1.5rem;">RMC Dashboard</div>', unsafe_allow_html=True)
st.sidebar.markdown("---")

page = st.sidebar.selectbox(
    "📊 Sayfa Seçin",
    ["🏠 Genel Bakış", "📋 Sığınma Talepleri", "🏘️ Evsizlik Değerlendirmeleri", 
     "🚀 Göç Yolları", "👤 Bireysel Veriler", "📝 Yönetim Özeti"]
)

st.sidebar.markdown("---")
st.sidebar.markdown("### 🎯 Filtreler")

# ============ PAGE: OVERVIEW ============
if page == "🏠 Genel Bakış":
    st.markdown('<div class="main-header">RMC Veri Analizi Dashboard</div>', unsafe_allow_html=True)
    st.markdown("##### West Midlands Mülteci ve Göçmen Merkezi - Veri Görselleştirme")
    
    # LA Filter for Overview
    wm_all_las = immigration_data[immigration_data['Region / Nation'] == 'West Midlands']['Local authority'].tolist()
    selected_las = st.sidebar.multiselect(
        "Yerel Otorite Seçin",
        options=wm_all_las,
        default=wm_all_las,
        key="overview_la"
    )
    
    # Filter data based on selection
    if selected_las:
        wm_immigration = immigration_data[
            (immigration_data['Region / Nation'] == 'West Midlands') & 
            (immigration_data['Local authority'].isin(selected_las))
        ]
    else:
        wm_immigration = immigration_data[immigration_data['Region / Nation'] == 'West Midlands']
    
    # Summary metrics
    col1, col2, col3, col4 = st.columns(4)
    
    total_pathways = wm_immigration['All 3 pathways (total) '].sum()
    total_ukraine = wm_immigration['Homes for Ukraine - not including super sponsors (arrivals)'].sum()
    total_afghan = wm_immigration['Afghan Resettlement Programme (total) (population)'].sum()
    total_asylum = wm_immigration['Supported Asylum (total) (population)'].sum()
    
    with col1:
        st.metric("Toplam Göç Yolları (WM)", f"{total_pathways:,.0f}")
    with col2:
        st.metric("Homes for Ukraine", f"{total_ukraine:,.0f}")
    with col3:
        st.metric("Afgan Yerleşim Programı", f"{total_afghan:,.0f}")
    with col4:
        st.metric("Destekli Sığınma", f"{total_asylum:,.0f}")
    
    st.markdown("---")
    
    # Two column layout for charts
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown('<div class="section-header">Bölgesel Karşılaştırma / Regional Comparison</div>', unsafe_allow_html=True)
        
        # Regional comparison
        regional_data = immigration_data.groupby('Region / Nation').agg({
            'All 3 pathways (total) ': 'sum'
        }).reset_index().sort_values('All 3 pathways (total) ', ascending=True).tail(10)
        
        fig_regional = px.bar(
            regional_data,
            y='Region / Nation',
            x='All 3 pathways (total) ',
            orientation='h',
            color='All 3 pathways (total) ',
            color_continuous_scale=['#1e293b', '#7c3aed', '#00d4ff'],
            labels={'All 3 pathways (total) ': 'Toplam', 'Region / Nation': 'Bölge'}
        )
        fig_regional.update_layout(
            plot_bgcolor='rgba(0,0,0,0)',
            paper_bgcolor='rgba(0,0,0,0)',
            font=dict(color='#e2e8f0', family='DM Sans'),
            showlegend=False,
            coloraxis_showscale=False,
            height=400
        )
        st.plotly_chart(fig_regional, use_container_width=True)
    
    with col2:
        st.markdown('<div class="section-header">Sığınma Başvuruları - Milliyet Dağılımı / Asylum Claims by Nationality</div>', unsafe_allow_html=True)
        
        top_nationalities = asylum_data.nlargest(8, 'People claiming asylum')
        fig_pie = px.pie(
            top_nationalities,
            values='People claiming asylum',
            names='Nationality',
            color_discrete_sequence=COLOR_SEQUENCE,
            hole=0.4
        )
        fig_pie.update_layout(**get_base_layout(height=400))
        fig_pie.update_traces(textposition='outside', textinfo='percent+label')
        st.plotly_chart(fig_pie, use_container_width=True)
    
    # West Midlands detailed view
    st.markdown('<div class="section-header">West Midlands - Yerel Otorite Detayı / Local Authority Detail</div>', unsafe_allow_html=True)
    
    wm_detail = wm_immigration[['Local authority', 'Homes for Ukraine - not including super sponsors (arrivals)',
                                 'Afghan Resettlement Programme (total) (population)',
                                 'Supported Asylum (total) (population)', 'All 3 pathways (total) ']].copy()
    wm_detail.columns = ['Yerel Otorite', 'Ukraine', 'Afgan', 'Sığınma', 'Toplam']
    wm_detail = wm_detail.sort_values('Toplam', ascending=False).head(15)
    
    # Melt for stacked bar
    wm_melted = wm_detail.melt(id_vars=['Yerel Otorite', 'Toplam'], 
                               value_vars=['Ukraine', 'Afgan', 'Sığınma'],
                               var_name='Program', value_name='Kişi Sayısı')
    
    fig_wm = px.bar(
        wm_melted,
        x='Yerel Otorite',
        y='Kişi Sayısı',
        color='Program',
        barmode='stack',
        color_discrete_sequence=['#00d4ff', '#7c3aed', '#f472b6']
    )
    fig_wm.update_layout(
        plot_bgcolor='rgba(0,0,0,0)',
        paper_bgcolor='rgba(0,0,0,0)',
        font=dict(color='#e2e8f0', family='DM Sans'),
        xaxis_tickangle=-45,
        height=450,
        legend=dict(
            orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1,
            font=dict(color='#e2e8f0', size=12),
            bgcolor='rgba(30, 41, 59, 0.8)',
            bordercolor='rgba(100, 116, 139, 0.3)',
            borderwidth=1
        )
    )
    st.plotly_chart(fig_wm, use_container_width=True)

# ============ PAGE: ASYLUM CLAIMS ============
elif page == "📋 Sığınma Talepleri":
    st.markdown('<div class="main-header">Sığınma Talepleri Analizi</div>', unsafe_allow_html=True)
    
    # Filters
    selected_nationalities = st.sidebar.multiselect(
        "Milliyet Seçin",
        options=asylum_data['Nationality'].tolist(),
        default=asylum_data['Nationality'].tolist()[:10]
    )
    
    filtered_asylum = asylum_data[asylum_data['Nationality'].isin(selected_nationalities)]
    
    # Summary metrics
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("Toplam Başvuru", f"{filtered_asylum['People claiming asylum'].sum():,.0f}")
    with col2:
        st.metric("Toplam Onay", f"{filtered_asylum['Grants of protection or other leave'].sum():,.0f}")
    with col3:
        st.metric("Toplam Red", f"{filtered_asylum['Refusals'].sum():,.0f}")
    with col4:
        avg_rate = filtered_asylum['Grant rate at initial decision (cases)'].mean()
        st.metric("Ortalama Onay Oranı", f"{avg_rate:.0%}")
    
    st.markdown("---")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown('<div class="section-header">Milliyet Bazında Başvuru Sayıları / Asylum Claims by Nationality</div>', unsafe_allow_html=True)
        
        fig_claims = px.bar(
            filtered_asylum.sort_values('People claiming asylum', ascending=True),
            y='Nationality',
            x='People claiming asylum',
            orientation='h',
            color='Grant rate at initial decision (cases)',
            color_continuous_scale=['#ef4444', '#f59e0b', '#10b981'],
            labels={'People claiming asylum': 'Başvuru / Claims', 'Nationality': 'Milliyet / Nationality',
                   'Grant rate at initial decision (cases)': 'Onay Oranı / Grant Rate'}
        )
        fig_claims.update_layout(
            **get_base_layout(height=500, show_legend=False),
            coloraxis_colorbar=dict(
                title=dict(text='Onay Oranı<br>Grant Rate', font=dict(color='#e2e8f0')),
                tickfont=dict(color='#e2e8f0')
            )
        )
        st.plotly_chart(fig_claims, use_container_width=True)
    
    with col2:
        st.markdown('<div class="section-header">Onay Oranı vs Bekleyen Başvurular / Grant Rate vs Pending Applications</div>', unsafe_allow_html=True)
        
        fig_scatter = px.scatter(
            filtered_asylum,
            x='Grant rate at initial decision (cases)',
            y='People awaiting an initial decision',
            size='People claiming asylum',
            color='Nationality',
            color_discrete_sequence=COLOR_SEQUENCE,
            labels={
                'Grant rate at initial decision (cases)': 'Onay Oranı / Grant Rate',
                'People awaiting an initial decision': 'Bekleyen / Pending',
                'People claiming asylum': 'Toplam / Total'
            },
            hover_data=['Nationality', 'People claiming asylum']
        )
        fig_scatter.update_layout(
            **get_base_layout(height=500),
            xaxis=dict(tickformat='.0%', color='#e2e8f0'),
            yaxis=dict(color='#e2e8f0')
        )
        st.plotly_chart(fig_scatter, use_container_width=True)
    
    # Small boat arrivals
    st.markdown('<div class="section-header">Küçük Tekne ile Gelenler vs Toplam Başvuru / Small Boat Arrivals vs Total Claims</div>', unsafe_allow_html=True)
    
    fig_boats = go.Figure()
    fig_boats.add_trace(go.Bar(
        x=filtered_asylum['Nationality'],
        y=filtered_asylum['People claiming asylum'],
        name='Toplam Başvuru',
        marker_color='#7c3aed'
    ))
    fig_boats.add_trace(go.Bar(
        x=filtered_asylum['Nationality'],
        y=filtered_asylum['Small boat arrivals claiming asylum'],
        name='Küçük Tekne',
        marker_color='#00d4ff'
    ))
    fig_boats.update_layout(
        barmode='group',
        plot_bgcolor='rgba(0,0,0,0)',
        paper_bgcolor='rgba(0,0,0,0)',
        font=dict(color='#e2e8f0', family='DM Sans'),
        height=400,
        xaxis_tickangle=-45,
        legend=dict(
            orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1,
            font=dict(color='#e2e8f0', size=12),
            bgcolor='rgba(30, 41, 59, 0.8)',
            bordercolor='rgba(100, 116, 139, 0.3)',
            borderwidth=1
        )
    )
    st.plotly_chart(fig_boats, use_container_width=True)

# ============ PAGE: HOMELESS ASSESSMENTS ============
elif page == "🏘️ Evsizlik Değerlendirmeleri":
    st.markdown('<div class="main-header">Evsizlik Değerlendirmeleri</div>', unsafe_allow_html=True)
    
    # Filter for regions only (not LAs)
    regions = homeless_data[homeless_data['Region'].str.contains('E12|ENGLAND|Rest of England', na=False) | 
                           (homeless_data['Region'].isin(['ENGLAND', 'London', 'Rest of England', 
                                                          'North East', 'North West', 'Yorkshire and The Humber',
                                                          'East Midlands', 'West Midlands', 'East of England',
                                                          'South East', 'South West']))].drop_duplicates(subset=['Region'])
    
    # Summary metrics
    wm_homeless = homeless_data[homeless_data['Region'] == 'West Midlands'].iloc[0] if len(homeless_data[homeless_data['Region'] == 'West Midlands']) > 0 else None
    england_homeless = homeless_data[homeless_data['Region'] == 'ENGLAND'].iloc[0] if len(homeless_data[homeless_data['Region'] == 'ENGLAND']) > 0 else None
    
    if wm_homeless is not None and england_homeless is not None:
        col1, col2, col3, col4 = st.columns(4)
        with col1:
            st.metric("WM Toplam Değerlendirme", f"{wm_homeless['Total initial assessments1,2,6']:,.0f}")
        with col2:
            st.metric("WM Evsizlik Oranı (‰)", f"{wm_homeless['Households assessed as homeless per (000s)']:.2f}")
        with col3:
            st.metric("İngiltere Ort. Evsizlik (‰)", f"{england_homeless['Households assessed as homeless per (000s)']:.2f}")
        with col4:
            diff = wm_homeless['Households assessed as homeless per (000s)'] - england_homeless['Households assessed as homeless per (000s)']
            st.metric("WM vs İngiltere Farkı", f"{diff:+.2f}")
    
    st.markdown("---")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown('<div class="section-header">Bölgesel Evsizlik Oranları / Regional Homelessness Rates</div>', unsafe_allow_html=True)
        
        # Filter main regions
        main_regions = ['North East', 'North West', 'Yorkshire and The Humber', 'East Midlands', 
                       'West Midlands', 'East of England', 'London', 'South East', 'South West']
        region_data = homeless_data[homeless_data['Region'].isin(main_regions)].copy()
        region_data = region_data.drop_duplicates(subset=['Region'])
        
        fig_homeless = px.bar(
            region_data.sort_values('Households assessed as homeless per (000s)', ascending=True),
            y='Region',
            x='Households assessed as homeless per (000s)',
            orientation='h',
            color='Households assessed as homeless per (000s)',
            color_continuous_scale=['#10b981', '#f59e0b', '#ef4444'],
            labels={'Households assessed as homeless per (000s)': 'Evsizlik Oranı (‰)', 'Region': 'Bölge'}
        )
        fig_homeless.update_layout(
            plot_bgcolor='rgba(0,0,0,0)',
            paper_bgcolor='rgba(0,0,0,0)',
            font=dict(color='#e2e8f0', family='DM Sans'),
            height=400,
            coloraxis_showscale=False
        )
        # Highlight West Midlands
        fig_homeless.add_vline(x=region_data[region_data['Region']=='West Midlands']['Households assessed as homeless per (000s)'].values[0] if len(region_data[region_data['Region']=='West Midlands']) > 0 else 0, 
                              line_dash="dash", line_color="#00d4ff", annotation_text="West Midlands")
        st.plotly_chart(fig_homeless, use_container_width=True)
    
    with col2:
        st.markdown('<div class="section-header">Önleme vs İyileştirme Görevi / Prevention vs Relief Duty</div>', unsafe_allow_html=True)
        
        fig_duty = go.Figure()
        fig_duty.add_trace(go.Bar(
            x=region_data['Region'],
            y=region_data['Threatened with homelessness within 56 days -  Prevention duty owed'],
            name='Önleme Görevi',
            marker_color='#7c3aed'
        ))
        fig_duty.add_trace(go.Bar(
            x=region_data['Region'],
            y=region_data['Homeless -  Relief duty owed4'],
            name='İyileştirme Görevi',
            marker_color='#f472b6'
        ))
        fig_duty.update_layout(
            barmode='group',
            plot_bgcolor='rgba(0,0,0,0)',
            paper_bgcolor='rgba(0,0,0,0)',
            font=dict(color='#e2e8f0', family='DM Sans'),
            height=400,
            xaxis_tickangle=-45,
            legend=dict(
            orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1,
            font=dict(color='#e2e8f0', size=12),
            bgcolor='rgba(30, 41, 59, 0.8)',
            bordercolor='rgba(100, 116, 139, 0.3)',
            borderwidth=1
        )
        )
        st.plotly_chart(fig_duty, use_container_width=True)
    
    # West Midlands LA Detail
    st.markdown('<div class="section-header">West Midlands Yerel Otoriteleri - Evsizlik Detayı / WM Local Authorities - Homelessness Detail</div>', unsafe_allow_html=True)
    
    # Get WM local authorities from homeless data
    wm_las_homeless = homeless_data[homeless_data['Unnamed: 0'].isin([
        'E08000025', 'E08000026', 'E08000027', 'E08000028', 'E08000029', 'E08000030', 'E08000031'
    ]) | homeless_data['Region'].isin(WEST_MIDLANDS_LAS)]
    
    if len(wm_las_homeless) > 0:
        fig_wm_homeless = px.treemap(
            wm_las_homeless.head(20),
            path=['Region'],
            values='Total initial assessments1,2,6',
            color='Households assessed as homeless per (000s)',
            color_continuous_scale=['#10b981', '#f59e0b', '#ef4444'],
            labels={'Total initial assessments1,2,6': 'Değerlendirme', 
                   'Households assessed as homeless per (000s)': 'Evsizlik Oranı'}
        )
        fig_wm_homeless.update_layout(
            plot_bgcolor='rgba(0,0,0,0)',
            paper_bgcolor='rgba(0,0,0,0)',
            font=dict(color='#e2e8f0', family='DM Sans'),
            height=400
        )
        st.plotly_chart(fig_wm_homeless, use_container_width=True)

# ============ PAGE: IMMIGRATION GROUPS ============
elif page == "🚀 Göç Yolları":
    st.markdown('<div class="main-header">Göç Yolları Analizi</div>', unsafe_allow_html=True)
    
    # Filters
    selected_region = st.sidebar.selectbox(
        "Bölge Seçin",
        options=['Tümü', 'West Midlands'] + sorted(immigration_data['Region / Nation'].unique().tolist()),
        key="imm_region"
    )
    
    if selected_region == 'Tümü':
        filtered_imm = immigration_data.copy()
    elif selected_region == 'West Midlands':
        filtered_imm = immigration_data[immigration_data['Region / Nation'] == 'West Midlands']
    else:
        filtered_imm = immigration_data[immigration_data['Region / Nation'] == selected_region]
    
    # LA Filter
    available_las = filtered_imm['Local authority'].unique().tolist()
    selected_imm_las = st.sidebar.multiselect(
        "Yerel Otorite Filtrele",
        options=available_las,
        default=[],
        key="imm_la"
    )
    
    if selected_imm_las:
        filtered_imm = filtered_imm[filtered_imm['Local authority'].isin(selected_imm_las)]
    
    # Summary metrics
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("Toplam (3 Yol)", f"{filtered_imm['All 3 pathways (total) '].sum():,.0f}")
    with col2:
        st.metric("Ukraine Programı", f"{filtered_imm['Homes for Ukraine - not including super sponsors (arrivals)'].sum():,.0f}")
    with col3:
        st.metric("Afgan Programı", f"{filtered_imm['Afghan Resettlement Programme (total) (population)'].sum():,.0f}")
    with col4:
        st.metric("Destekli Sığınma", f"{filtered_imm['Supported Asylum (total) (population)'].sum():,.0f}")
    
    st.markdown("---")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown('<div class="section-header">Program Bazında Dağılım (Top 15 LA) / Distribution by Programme</div>', unsafe_allow_html=True)
        
        top_las = filtered_imm.nlargest(15, 'All 3 pathways (total) ')
        
        fig_stacked = go.Figure()
        fig_stacked.add_trace(go.Bar(
            x=top_las['Local authority'],
            y=top_las['Homes for Ukraine - not including super sponsors (arrivals)'],
            name='Ukraine',
            marker_color='#00d4ff'
        ))
        fig_stacked.add_trace(go.Bar(
            x=top_las['Local authority'],
            y=top_las['Afghan Resettlement Programme (total) (population)'],
            name='Afgan',
            marker_color='#7c3aed'
        ))
        fig_stacked.add_trace(go.Bar(
            x=top_las['Local authority'],
            y=top_las['Supported Asylum (total) (population)'],
            name='Sığınma',
            marker_color='#f472b6'
        ))
        fig_stacked.update_layout(
            barmode='stack',
            **get_base_layout(height=450),
            xaxis_tickangle=-45
        )
        st.plotly_chart(fig_stacked, use_container_width=True)
    
    with col2:
        st.markdown('<div class="section-header">Nüfus Yüzdesi - Treemap / Population Percentage</div>', unsafe_allow_html=True)
        
        top_pct = filtered_imm.nlargest(20, 'Percentage of population (%)')
        
        fig_treemap = px.treemap(
            top_pct,
            path=['Local authority'],
            values='All 3 pathways (total) ',
            color='Percentage of population (%)',
            color_continuous_scale=['#1e293b', '#7c3aed', '#00d4ff'],
            labels={'All 3 pathways (total) ': 'Toplam', 'Percentage of population (%)': 'Nüfus %'}
        )
        fig_treemap.update_layout(
            plot_bgcolor='rgba(0,0,0,0)',
            paper_bgcolor='rgba(0,0,0,0)',
            font=dict(color='#e2e8f0', family='DM Sans'),
            height=450
        )
        st.plotly_chart(fig_treemap, use_container_width=True)
    
    # Asylum accommodation breakdown
    st.markdown('<div class="section-header">Sığınma Konaklama Türleri / Asylum Accommodation Types</div>', unsafe_allow_html=True)
    
    accommodation_cols = ['of which, Supported Asylum - Initial Accommodation (population)',
                         'of which, Supported Asylum - Dispersal Accommodation (population)',
                         'of which, Supported Asylum - Contingency Accommodation (population)']
    
    accommodation_data = filtered_imm[accommodation_cols].sum()
    
    fig_accom = px.pie(
        values=accommodation_data.values,
        names=['İlk Konaklama', 'Dağıtım Konaklaması', 'Acil Konaklama'],
        color_discrete_sequence=['#00d4ff', '#7c3aed', '#f472b6'],
        hole=0.4
    )
    fig_accom.update_layout(**get_base_layout(height=350))
    st.plotly_chart(fig_accom, use_container_width=True)

# ============ PAGE: INDIVIDUAL DATA ============
elif page == "👤 Bireysel Veriler":
    st.markdown('<div class="main-header">Bireysel Veri Analizi</div>', unsafe_allow_html=True)
    
    # Filters
    selected_status = st.sidebar.multiselect(
        "Göçmenlik Durumu",
        options=example_data['Immigration Status'].unique().tolist(),
        default=example_data['Immigration Status'].unique().tolist()
    )
    
    selected_nationality = st.sidebar.multiselect(
        "Milliyet",
        options=example_data['Nationality'].unique().tolist(),
        default=example_data['Nationality'].unique().tolist()
    )
    
    filtered_example = example_data[
        (example_data['Immigration Status'].isin(selected_status)) &
        (example_data['Nationality'].isin(selected_nationality))
    ]
    
    # Summary metrics
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("Toplam Kayıt", len(filtered_example))
    with col2:
        st.metric("Ort. UK'de Süre (ay)", f"{filtered_example['Time in UK (months)'].mean():.1f}")
    with col3:
        st.metric("Ort. Entegrasyon Skoru", f"{filtered_example['Integration Metric'].mean():.1f}")
    with col4:
        fluent_pct = len(filtered_example[filtered_example['English Level'] == 'Fluent']) / len(filtered_example) * 100 if len(filtered_example) > 0 else 0
        st.metric("Akıcı İngilizce %", f"{fluent_pct:.1f}%")
    
    st.markdown("---")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown('<div class="section-header">Göçmenlik Durumu Dağılımı / Immigration Status Distribution</div>', unsafe_allow_html=True)
        
        status_counts = filtered_example['Immigration Status'].value_counts()
        
        fig_status = px.pie(
            values=status_counts.values,
            names=status_counts.index,
            color_discrete_sequence=COLOR_SEQUENCE,
            hole=0.4
        )
        fig_status.update_layout(**get_base_layout(height=350))
        st.plotly_chart(fig_status, use_container_width=True)
    
    with col2:
        st.markdown('<div class="section-header">Acil İhtiyaç Kategorileri / Urgent Need Categories</div>', unsafe_allow_html=True)
        
        need_counts = filtered_example['Urgent Need'].value_counts()
        
        fig_needs = px.bar(
            x=need_counts.index,
            y=need_counts.values,
            color=need_counts.values,
            color_continuous_scale=['#1e293b', '#7c3aed', '#00d4ff'],
            labels={'x': 'İhtiyaç Türü', 'y': 'Kişi Sayısı'}
        )
        fig_needs.update_layout(
            plot_bgcolor='rgba(0,0,0,0)',
            paper_bgcolor='rgba(0,0,0,0)',
            font=dict(color='#e2e8f0', family='DM Sans'),
            height=350,
            showlegend=False,
            coloraxis_showscale=False
        )
        st.plotly_chart(fig_needs, use_container_width=True)
    
    # Scatter plot
    st.markdown('<div class="section-header">Entegrasyon Metrikleri: Süre vs Skor / Integration Metrics: Time vs Score</div>', unsafe_allow_html=True)
    
    fig_scatter = px.scatter(
        filtered_example,
        x='Time in UK (months)',
        y='Integration Metric',
        color='Immigration Status',
        size='Integration Metric',
        symbol='English Level',
        color_discrete_sequence=COLOR_SEQUENCE,
        labels={
            'Time in UK (months)': 'UK\'de Süre / Time in UK (months)',
            'Integration Metric': 'Entegrasyon / Integration',
            'Immigration Status': 'Durum / Status',
            'English Level': 'İngilizce / English'
        },
        hover_data=['Nationality', 'Urgent Need']
    )
    fig_scatter.update_layout(**get_base_layout(height=450))
    st.plotly_chart(fig_scatter, use_container_width=True)
    
    # Nationality breakdown
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown('<div class="section-header">Milliyet Dağılımı / Nationality Distribution</div>', unsafe_allow_html=True)
        
        nat_counts = filtered_example['Nationality'].value_counts()
        
        fig_nat = px.bar(
            y=nat_counts.index,
            x=nat_counts.values,
            orientation='h',
            color=nat_counts.values,
            color_continuous_scale=['#1e293b', '#7c3aed', '#00d4ff'],
            labels={'x': 'Kişi Sayısı', 'y': 'Milliyet'}
        )
        fig_nat.update_layout(
            plot_bgcolor='rgba(0,0,0,0)',
            paper_bgcolor='rgba(0,0,0,0)',
            font=dict(color='#e2e8f0', family='DM Sans'),
            height=400,
            showlegend=False,
            coloraxis_showscale=False
        )
        st.plotly_chart(fig_nat, use_container_width=True)
    
    with col2:
        st.markdown('<div class="section-header">İngilizce Seviyesi vs Durum / English Level vs Status</div>', unsafe_allow_html=True)
        
        eng_status = filtered_example.groupby(['English Level', 'Immigration Status']).size().reset_index(name='count')
        
        fig_eng = px.bar(
            eng_status,
            x='English Level',
            y='count',
            color='Immigration Status',
            barmode='group',
            color_discrete_sequence=COLOR_SEQUENCE,
            labels={'count': 'Kişi / People', 'English Level': 'İngilizce / English', 'Immigration Status': 'Durum / Status'}
        )
        fig_eng.update_layout(**get_base_layout(height=400))
        st.plotly_chart(fig_eng, use_container_width=True)

# ============ PAGE: BRIEFING ============
elif page == "📝 Yönetim Özeti":
    st.markdown('<div class="main-header">Yönetim Özeti / Briefing</div>', unsafe_allow_html=True)
    
    # Calculate key statistics for briefing
    wm_immigration = immigration_data[immigration_data['Region / Nation'] == 'West Midlands']
    total_wm = wm_immigration['All 3 pathways (total) '].sum()
    top_wm_la = wm_immigration.nlargest(1, 'All 3 pathways (total) ')['Local authority'].values[0]
    top_wm_count = wm_immigration.nlargest(1, 'All 3 pathways (total) ')['All 3 pathways (total) '].values[0]
    
    # Asylum stats
    top_asylum_nat = asylum_data.nlargest(3, 'People claiming asylum')['Nationality'].tolist()
    highest_grant = asylum_data.nlargest(1, 'Grant rate at initial decision (cases)')
    lowest_grant = asylum_data.nsmallest(1, 'Grant rate at initial decision (cases)')
    
    # Example data stats  
    top_needs = example_data['Urgent Need'].value_counts().head(3).index.tolist()
    refugee_pct = len(example_data[example_data['Immigration Status'] == 'Refugee']) / len(example_data) * 100
    avg_integration = example_data['Integration Metric'].mean()
    
    briefing_text = f"""
## RMC Veri Analizi Yönetim Özeti

### Genel Değerlendirme
West Midlands bölgesi, İngiltere'nin mülteci ve göçmen nüfusuna ev sahipliği yapan önemli bölgelerden biridir. Mevcut veriler, bölgedeki toplam **{total_wm:,.0f}** kişinin üç ana göç yolu (Homes for Ukraine, Afgan Yerleşim Programı ve Destekli Sığınma) kapsamında bulunduğunu göstermektedir.

### Temel Bulgular

**1. Yerel Otorite Yoğunluğu**
{top_wm_la}, **{top_wm_count:,.0f}** kişi ile West Midlands'daki en yüksek göçmen nüfusuna sahip yerel otoritedir. Birmingham, Coventry ve Wolverhampton gibi büyük şehirler, kaynak tahsisi ve hizmet planlaması için öncelikli bölgeler olmalıdır.

**2. Sığınma Başvuru Trendleri**
Ulusal düzeyde en fazla sığınma başvurusu **{', '.join(top_asylum_nat)}** vatandaşlarından gelmektedir. {highest_grant['Nationality'].values[0]} vatandaşları **%{highest_grant['Grant rate at initial decision (cases)'].values[0]*100:.0f}** ile en yüksek onay oranına sahipken, {lowest_grant['Nationality'].values[0]} başvuruları **%{lowest_grant['Grant rate at initial decision (cases)'].values[0]*100:.0f}** ile en düşük onay oranını göstermektedir.

**3. Acil İhtiyaç Profili**
Bireysel veri analizine göre, RMC hizmet alanlarının en kritik ihtiyaçları **{', '.join(top_needs)}** kategorilerinde yoğunlaşmaktadır. Bu durum, istihdam desteği ve finansal danışmanlık hizmetlerine olan talebin yüksekliğini vurgulamaktadır.

**4. Entegrasyon Göstergeleri**
Ortalama entegrasyon skoru **{avg_integration:.1f}/10** düzeyindedir. Mülteci statüsündeki bireylerin oranı **%{refugee_pct:.1f}** olup, bu grubun daha kalıcı entegrasyon hizmetlerine ihtiyaç duyduğu görülmektedir.

### Politika ve Hizmet Önerileri

1. **Kaynak Önceliklendirme**: Birmingham ve Coventry ofislerinde kapasite artırımı değerlendirilmelidir.

2. **Dil Eğitimi**: İngilizce seviyesi düşük olan gruplara yönelik yoğunlaştırılmış dil kursları sunulmalıdır.

3. **İstihdam Programları**: Acil ihtiyaç verilerine dayanarak, istihdam odaklı programlar genişletilmelidir.

4. **Konaklama Desteği**: Sığınma konaklama türlerindeki çeşitlilik, konaklama danışmanlığı hizmetinin önemini göstermektedir.

5. **Milliyet Bazlı Yaklaşım**: Sudan, İran ve Eritre'den gelen yüksek onay oranlı başvuru sahipleri için uzun vadeli entegrasyon planları hazırlanmalıdır.

### Sonuç
RMC'nin West Midlands'daki dört ofisi, bölgedeki mülteci ve göçmen nüfusunun ihtiyaçlarını karşılamak için stratejik konumdadır. Veri odaklı karar alma, hizmet kalitesinin artırılması ve kaynakların etkin kullanılması için kritik öneme sahiptir.

---
*Bu özet, Haziran 2025 tarihli veriler kullanılarak hazırlanmıştır.*
    """
    
    st.markdown(f'<div class="briefing-box">{briefing_text}</div>', unsafe_allow_html=True)
    
    # Key metrics summary
    st.markdown("---")
    st.markdown('<div class="section-header">Özet İstatistikler / Summary Statistics</div>', unsafe_allow_html=True)
    
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.metric("West Midlands Toplam", f"{total_wm:,.0f}", help="3 göç yolu toplamı")
    with col2:
        st.metric("En Yoğun LA", top_wm_la)
    with col3:
        st.metric("Ort. Entegrasyon", f"{avg_integration:.1f}/10")
    with col4:
        st.metric("Bireysel Kayıt", f"{len(example_data)}")
    
    # Download briefing
    st.download_button(
        label="📥 Özeti İndir (TXT)",
        data=briefing_text,
        file_name="rmc_briefing.txt",
        mime="text/plain"
    )

# Footer
st.sidebar.markdown("---")
st.sidebar.markdown("##### RMC Dashboard v1.0")
st.sidebar.markdown("West Midlands Refugee & Migrant Centre")

