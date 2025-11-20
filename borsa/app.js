// Stock Market Application
class StockMarketApp {
    constructor() {
        this.stocks = this.generateStockData();
        this.selectedStock = null;
        this.chart = null;
        this.watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
        this.init();
    }

    // Generate realistic Turkish stock data
    generateStockData() {
        const turkishStocks = [
            { symbol: 'THYAO', name: 'Türk Hava Yolları', sector: 'Ulaştırma', basePrice: 285.50 },
            { symbol: 'GARAN', name: 'Garanti BBVA', sector: 'Bankacılık', basePrice: 98.75 },
            { symbol: 'AKBNK', name: 'Akbank', sector: 'Bankacılık', basePrice: 52.30 },
            { symbol: 'EREGL', name: 'Ereğli Demir Çelik', sector: 'Metal Ana', basePrice: 42.80 },
            { symbol: 'SAHOL', name: 'Sabancı Holding', sector: 'Holding', basePrice: 68.90 },
            { symbol: 'SISE', name: 'Şişe Cam', sector: 'Taş Toprak', basePrice: 57.25 },
            { symbol: 'TUPRS', name: 'Tüpraş', sector: 'Petrol', basePrice: 165.40 },
            { symbol: 'PETKM', name: 'Petkim', sector: 'Kimya', basePrice: 24.65 },
            { symbol: 'KCHOL', name: 'Koç Holding', sector: 'Holding', basePrice: 189.30 },
            { symbol: 'ASELS', name: 'Aselsan', sector: 'Savunma', basePrice: 325.75 },
            { symbol: 'TCELL', name: 'Turkcell', sector: 'Telekomünikasyon', basePrice: 78.40 },
            { symbol: 'TTKOM', name: 'Türk Telekom', sector: 'Telekomünikasyon', basePrice: 45.20 },
            { symbol: 'KRDMD', name: 'Kardemir', sector: 'Metal Ana', basePrice: 18.95 },
            { symbol: 'KOZAL', name: 'Koza Altın', sector: 'Madencilik', basePrice: 125.60 },
            { symbol: 'BIMAS', name: 'BIM', sector: 'Perakende', basePrice: 234.50 },
            { symbol: 'MGROS', name: 'Migros', sector: 'Perakende', basePrice: 156.80 },
            { symbol: 'ARCLK', name: 'Arçelik', sector: 'Teknoloji', basePrice: 89.45 },
            { symbol: 'VESTL', name: 'Vestel', sector: 'Teknoloji', basePrice: 32.70 },
            { symbol: 'FROTO', name: 'Ford Otosan', sector: 'Otomotiv', basePrice: 412.30 },
            { symbol: 'TOASO', name: 'Tofaş', sector: 'Otomotiv', basePrice: 178.25 }
        ];

        return turkishStocks.map(stock => ({
            ...stock,
            currentPrice: this.calculateCurrentPrice(stock.basePrice),
            change: this.generateRandomChange(),
            volume: this.generateVolume(),
            open: stock.basePrice * (1 + (Math.random() - 0.5) * 0.02),
            high: stock.basePrice * (1 + Math.random() * 0.03),
            low: stock.basePrice * (1 - Math.random() * 0.03),
            historicalData: this.generateHistoricalData(stock.basePrice, 90)
        }));
    }

    calculateCurrentPrice(basePrice) {
        return basePrice * (1 + (Math.random() - 0.5) * 0.1);
    }

    generateRandomChange() {
        return (Math.random() - 0.5) * 10;
    }

    generateVolume() {
        return Math.floor(Math.random() * 50000000) + 1000000;
    }

    generateHistoricalData(basePrice, days) {
        const data = [];
        let price = basePrice;
        const today = new Date();

        for (let i = days; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);

            // Simulate realistic price movement
            const change = (Math.random() - 0.48) * 0.03; // Slight upward bias
            price = price * (1 + change);

            data.push({
                date: date.toISOString().split('T')[0],
                open: price * (1 + (Math.random() - 0.5) * 0.01),
                high: price * (1 + Math.random() * 0.02),
                low: price * (1 - Math.random() * 0.02),
                close: price,
                volume: this.generateVolume()
            });
        }

        return data;
    }

    // Technical Analysis Functions
    calculateRSI(data, period = 14) {
        if (data.length < period + 1) return 50;

        let gains = 0;
        let losses = 0;

        for (let i = data.length - period; i < data.length; i++) {
            const change = data[i].close - data[i - 1].close;
            if (change > 0) gains += change;
            else losses -= change;
        }

        const avgGain = gains / period;
        const avgLoss = losses / period;

        if (avgLoss === 0) return 100;
        const rs = avgGain / avgLoss;
        return 100 - (100 / (1 + rs));
    }

    calculateMACD(data) {
        const ema12 = this.calculateEMA(data, 12);
        const ema26 = this.calculateEMA(data, 26);
        return ema12 - ema26;
    }

    calculateEMA(data, period) {
        if (data.length === 0) return 0;

        const k = 2 / (period + 1);
        let ema = data[0].close;

        for (let i = 1; i < data.length; i++) {
            ema = data[i].close * k + ema * (1 - k);
        }

        return ema;
    }

    calculateSMA(data, period) {
        if (data.length < period) return 0;

        const slice = data.slice(-period);
        const sum = slice.reduce((acc, item) => acc + item.close, 0);
        return sum / period;
    }

    calculateBollingerBands(data, period = 20) {
        const sma = this.calculateSMA(data, period);
        const slice = data.slice(-period);

        const variance = slice.reduce((acc, item) => {
            return acc + Math.pow(item.close - sma, 2);
        }, 0) / period;

        const stdDev = Math.sqrt(variance);

        return {
            upper: sma + (stdDev * 2),
            middle: sma,
            lower: sma - (stdDev * 2)
        };
    }

    // Prediction Algorithm
    predictFuturePrice(stock, days) {
        const data = stock.historicalData;
        const recentData = data.slice(-30);

        // Calculate trend
        const trend = this.calculateTrend(recentData);

        // Calculate volatility
        const volatility = this.calculateVolatility(recentData);

        // RSI influence
        const rsi = this.calculateRSI(data);
        const rsiInfluence = (rsi - 50) / 100; // -0.5 to +0.5

        // MACD influence
        const macd = this.calculateMACD(data);
        const macdInfluence = Math.max(-0.02, Math.min(0.02, macd / stock.currentPrice));

        // Combine factors for prediction
        const dailyChange = trend + (rsiInfluence * 0.01) + macdInfluence;
        const predictedPrice = stock.currentPrice * Math.pow(1 + dailyChange, days);

        return {
            price: predictedPrice,
            change: ((predictedPrice - stock.currentPrice) / stock.currentPrice) * 100,
            confidence: this.calculateConfidence(rsi, volatility)
        };
    }

    calculateTrend(data) {
        if (data.length < 2) return 0;

        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        const n = data.length;

        data.forEach((item, i) => {
            sumX += i;
            sumY += item.close;
            sumXY += i * item.close;
            sumX2 += i * i;
        });

        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const avgPrice = sumY / n;

        return slope / avgPrice; // Normalized trend
    }

    calculateVolatility(data) {
        const returns = [];
        for (let i = 1; i < data.length; i++) {
            returns.push((data[i].close - data[i - 1].close) / data[i - 1].close);
        }

        const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
        const variance = returns.reduce((acc, r) => acc + Math.pow(r - mean, 2), 0) / returns.length;

        return Math.sqrt(variance);
    }

    calculateConfidence(rsi, volatility) {
        // Higher confidence when RSI is not extreme and volatility is low
        let confidence = 50;

        if (rsi > 30 && rsi < 70) confidence += 20;
        if (volatility < 0.02) confidence += 20;
        if (volatility < 0.01) confidence += 10;

        return Math.min(100, confidence);
    }

    // Investment Score Calculation
    calculateInvestmentScore(stock) {
        const rsi = this.calculateRSI(stock.historicalData);
        const macd = this.calculateMACD(stock.historicalData);
        const sma20 = this.calculateSMA(stock.historicalData, 20);
        const sma50 = this.calculateSMA(stock.historicalData, 50);
        const bollinger = this.calculateBollingerBands(stock.historicalData);
        const trend = this.calculateTrend(stock.historicalData.slice(-30));

        let score = 50; // Base score

        // RSI scoring (oversold = good buy opportunity)
        if (rsi < 30) score += 20;
        else if (rsi < 40) score += 15;
        else if (rsi > 70) score -= 20;
        else if (rsi > 60) score -= 10;

        // MACD scoring
        if (macd > 0) score += 10;

        // Moving average crossover
        if (sma20 > sma50) score += 15;

        // Bollinger bands
        if (stock.currentPrice < bollinger.lower) score += 15; // Oversold
        else if (stock.currentPrice > bollinger.upper) score -= 15; // Overbought

        // Trend scoring
        if (trend > 0.001) score += 10;
        else if (trend < -0.001) score -= 10;

        // Volume analysis
        const avgVolume = stock.historicalData.slice(-20).reduce((acc, d) => acc + d.volume, 0) / 20;
        if (stock.volume > avgVolume * 1.5) score += 5;

        return Math.max(0, Math.min(100, score));
    }

    // Get recommended stocks
    getRecommendedStocks() {
        return this.stocks
            .map(stock => ({
                ...stock,
                score: this.calculateInvestmentScore(stock)
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);
    }

    // Get top gainers and losers
    getTopGainers() {
        return [...this.stocks]
            .sort((a, b) => b.change - a.change)
            .slice(0, 5);
    }

    getTopLosers() {
        return [...this.stocks]
            .sort((a, b) => a.change - b.change)
            .slice(0, 5);
    }

    // UI Rendering Functions
    init() {
        this.updateBIST100();
        this.renderRecommendedStocks();
        this.renderTopGainers();
        this.renderTopLosers();
        this.setupEventListeners();
        this.renderWatchlist();

        // Auto refresh every 30 seconds
        setInterval(() => this.refreshData(), 30000);
    }

    updateBIST100() {
        const bist100Value = 9847.32 + (Math.random() - 0.5) * 100;
        const bist100Change = (Math.random() - 0.5) * 2;

        document.getElementById('bist100').textContent = bist100Value.toFixed(2);

        const changeElement = document.getElementById('bist100-change');
        changeElement.textContent = `${bist100Change >= 0 ? '+' : ''}${bist100Change.toFixed(2)}%`;
        changeElement.className = `stat-change ${bist100Change >= 0 ? 'positive' : 'negative'}`;

        const totalVolume = this.stocks.reduce((acc, s) => acc + s.volume, 0);
        document.getElementById('total-volume').textContent =
            `₺${(totalVolume / 1000000000).toFixed(2)}M`;
    }

    renderRecommendedStocks() {
        const container = document.getElementById('recommended-stocks');
        const recommended = this.getRecommendedStocks();

        container.innerHTML = recommended.map(stock => `
            <div class="stock-item recommended" data-symbol="${stock.symbol}">
                <div class="stock-info">
                    <div class="stock-symbol">${stock.symbol}</div>
                    <div class="stock-name">${stock.name}</div>
                </div>
                <div class="stock-score">
                    <span class="score-badge">${stock.score.toFixed(0)}/100</span>
                    <span class="stock-price">₺${stock.currentPrice.toFixed(2)}</span>
                    <span class="stock-change ${stock.change >= 0 ? 'positive' : 'negative'}">
                        ${stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)}%
                    </span>
                </div>
            </div>
        `).join('');

        this.attachStockClickListeners();
    }

    renderTopGainers() {
        const container = document.getElementById('top-gainers');
        const gainers = this.getTopGainers();

        container.innerHTML = gainers.map(stock => `
            <div class="stock-item" data-symbol="${stock.symbol}">
                <div class="stock-info">
                    <div class="stock-symbol">${stock.symbol}</div>
                    <div class="stock-name">${stock.name}</div>
                </div>
                <div class="stock-score">
                    <span class="stock-price">₺${stock.currentPrice.toFixed(2)}</span>
                    <span class="stock-change positive">+${stock.change.toFixed(2)}%</span>
                </div>
            </div>
        `).join('');

        this.attachStockClickListeners();
    }

    renderTopLosers() {
        const container = document.getElementById('top-losers');
        const losers = this.getTopLosers();

        container.innerHTML = losers.map(stock => `
            <div class="stock-item" data-symbol="${stock.symbol}">
                <div class="stock-info">
                    <div class="stock-symbol">${stock.symbol}</div>
                    <div class="stock-name">${stock.name}</div>
                </div>
                <div class="stock-score">
                    <span class="stock-price">₺${stock.currentPrice.toFixed(2)}</span>
                    <span class="stock-change negative">${stock.change.toFixed(2)}%</span>
                </div>
            </div>
        `).join('');

        this.attachStockClickListeners();
    }

    attachStockClickListeners() {
        document.querySelectorAll('.stock-item').forEach(item => {
            item.addEventListener('click', () => {
                const symbol = item.dataset.symbol;
                this.selectStock(symbol);
            });
        });
    }

    selectStock(symbol) {
        this.selectedStock = this.stocks.find(s => s.symbol === symbol);
        if (!this.selectedStock) return;

        this.renderStockDetail();
        this.renderChart();
        this.renderAnalysis();
        this.renderPredictions();
    }

    renderStockDetail() {
        const stock = this.selectedStock;

        document.getElementById('selected-stock-name').textContent = stock.name;
        document.getElementById('selected-stock-code').textContent = stock.symbol;
        document.getElementById('current-price').textContent = `₺${stock.currentPrice.toFixed(2)}`;

        const changeElement = document.getElementById('price-change');
        changeElement.textContent = `${stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)}%`;
        changeElement.className = `price-change ${stock.change >= 0 ? 'positive' : 'negative'}`;

        document.getElementById('open-price').textContent = `₺${stock.open.toFixed(2)}`;
        document.getElementById('high-price').textContent = `₺${stock.high.toFixed(2)}`;
        document.getElementById('low-price').textContent = `₺${stock.low.toFixed(2)}`;
        document.getElementById('volume').textContent =
            `${(stock.volume / 1000000).toFixed(2)}M`;

        const rsi = this.calculateRSI(stock.historicalData);
        document.getElementById('rsi').textContent = rsi.toFixed(2);

        const macd = this.calculateMACD(stock.historicalData);
        document.getElementById('macd').textContent = macd.toFixed(2);
    }

    renderChart(period = '1M') {
        const stock = this.selectedStock;
        let data = stock.historicalData;

        // Filter data based on period
        const periodDays = {
            '1D': 1,
            '1W': 7,
            '1M': 30,
            '3M': 90,
            '1Y': 365
        };

        data = data.slice(-periodDays[period]);

        const ctx = document.getElementById('stock-chart').getContext('2d');

        if (this.chart) {
            this.chart.destroy();
        }

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(d => d.date),
                datasets: [{
                    label: stock.symbol,
                    data: data.map(d => d.close),
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 5,
                    pointHoverBackgroundColor: '#2563eb',
                    pointHoverBorderColor: '#fff',
                    pointHoverBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleColor: '#f1f5f9',
                        bodyColor: '#cbd5e1',
                        borderColor: '#475569',
                        borderWidth: 1,
                        padding: 12,
                        displayColors: false,
                        callbacks: {
                            label: (context) => `Fiyat: ₺${context.parsed.y.toFixed(2)}`
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(71, 85, 105, 0.3)',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#cbd5e1',
                            maxTicksLimit: 8
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(71, 85, 105, 0.3)',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#cbd5e1',
                            callback: (value) => `₺${value.toFixed(2)}`
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    }

    renderAnalysis() {
        const stock = this.selectedStock;
        const rsi = this.calculateRSI(stock.historicalData);
        const macd = this.calculateMACD(stock.historicalData);
        const sma20 = this.calculateSMA(stock.historicalData, 20);
        const sma50 = this.calculateSMA(stock.historicalData, 50);
        const bollinger = this.calculateBollingerBands(stock.historicalData);

        let signal = 'NOTR';
        let signalClass = 'neutral';

        if (rsi < 30 && macd > 0) {
            signal = 'GÜÇLÜ AL';
            signalClass = 'bullish';
        } else if (rsi < 40 || stock.currentPrice < bollinger.lower) {
            signal = 'AL';
            signalClass = 'bullish';
        } else if (rsi > 70 && macd < 0) {
            signal = 'GÜÇLÜ SAT';
            signalClass = 'bearish';
        } else if (rsi > 60 || stock.currentPrice > bollinger.upper) {
            signal = 'SAT';
            signalClass = 'bearish';
        }

        const trend = sma20 > sma50 ? 'YUKARI' : 'AŞAĞI';
        const trendClass = sma20 > sma50 ? 'bullish' : 'bearish';

        const container = document.getElementById('technical-analysis');
        container.innerHTML = `
            <div class="analysis-item">
                <span class="analysis-label">Sinyal</span>
                <span class="analysis-value ${signalClass}">${signal}</span>
            </div>
            <div class="analysis-item">
                <span class="analysis-label">Trend (MA20/50)</span>
                <span class="analysis-value ${trendClass}">${trend}</span>
            </div>
            <div class="analysis-item">
                <span class="analysis-label">RSI Durumu</span>
                <span class="analysis-value ${rsi < 30 ? 'bullish' : rsi > 70 ? 'bearish' : 'neutral'}">
                    ${rsi < 30 ? 'Aşırı Satım' : rsi > 70 ? 'Aşırı Alım' : 'Normal'}
                </span>
            </div>
            <div class="analysis-item">
                <span class="analysis-label">Bollinger Pozisyonu</span>
                <span class="analysis-value ${stock.currentPrice < bollinger.lower ? 'bullish' : stock.currentPrice > bollinger.upper ? 'bearish' : 'neutral'}">
                    ${stock.currentPrice < bollinger.lower ? 'Alt Band' : stock.currentPrice > bollinger.upper ? 'Üst Band' : 'Orta'}
                </span>
            </div>
        `;
    }

    renderPredictions() {
        const stock = this.selectedStock;
        const predictions = {
            '1 Hafta': this.predictFuturePrice(stock, 7),
            '1 Ay': this.predictFuturePrice(stock, 30),
            '3 Ay': this.predictFuturePrice(stock, 90)
        };

        const container = document.getElementById('predictions');
        container.innerHTML = Object.entries(predictions).map(([period, pred]) => `
            <div class="prediction-item">
                <div class="prediction-period">${period}</div>
                <div class="prediction-value">₺${pred.price.toFixed(2)}</div>
                <div class="prediction-change ${pred.change >= 0 ? 'positive' : 'negative'}">
                    ${pred.change >= 0 ? '+' : ''}${pred.change.toFixed(2)}%
                    (Güven: ${pred.confidence}%)
                </div>
            </div>
        `).join('');
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('stock-search');
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toUpperCase();
            const results = this.stocks.filter(s =>
                s.symbol.includes(query) || s.name.toUpperCase().includes(query)
            );

            if (query && results.length > 0) {
                this.selectStock(results[0].symbol);
            }
        });

        // Refresh button
        document.getElementById('refresh-btn').addEventListener('click', () => {
            this.refreshData();
        });

        // Chart period buttons
        document.querySelectorAll('.chart-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.chart-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.renderChart(btn.dataset.period);
            });
        });
    }

    refreshData() {
        // Simulate price updates
        this.stocks.forEach(stock => {
            const change = (Math.random() - 0.5) * 0.02;
            stock.currentPrice *= (1 + change);
            stock.change = ((stock.currentPrice - stock.basePrice) / stock.basePrice) * 100;
            stock.volume = this.generateVolume();

            // Add new historical data point
            const lastData = stock.historicalData[stock.historicalData.length - 1];
            stock.historicalData.push({
                date: new Date().toISOString().split('T')[0],
                open: lastData.close,
                high: stock.currentPrice * (1 + Math.random() * 0.01),
                low: stock.currentPrice * (1 - Math.random() * 0.01),
                close: stock.currentPrice,
                volume: stock.volume
            });

            // Keep only last 365 days
            if (stock.historicalData.length > 365) {
                stock.historicalData.shift();
            }
        });

        this.updateBIST100();
        this.renderRecommendedStocks();
        this.renderTopGainers();
        this.renderTopLosers();

        if (this.selectedStock) {
            this.selectedStock = this.stocks.find(s => s.symbol === this.selectedStock.symbol);
            this.renderStockDetail();
            this.renderChart();
            this.renderAnalysis();
            this.renderPredictions();
        }
    }

    renderWatchlist() {
        const container = document.getElementById('watchlist');

        if (this.watchlist.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-list"></i>
                    <p>İzleme listeniz boş. Hisse aramadan ekleyebilirsiniz.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.watchlist.map(symbol => {
            const stock = this.stocks.find(s => s.symbol === symbol);
            if (!stock) return '';

            return `
                <div class="watchlist-item" data-symbol="${stock.symbol}">
                    <div class="stock-symbol">${stock.symbol}</div>
                    <div class="stock-name">${stock.name}</div>
                    <div class="stock-price">₺${stock.currentPrice.toFixed(2)}</div>
                    <div class="stock-change ${stock.change >= 0 ? 'positive' : 'negative'}">
                        ${stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)}%
                    </div>
                </div>
            `;
        }).join('');

        document.querySelectorAll('.watchlist-item').forEach(item => {
            item.addEventListener('click', () => {
                this.selectStock(item.dataset.symbol);
            });
        });
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.stockApp = new StockMarketApp();
});
