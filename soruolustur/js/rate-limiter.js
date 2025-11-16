/**
 * Rate Limiter Module
 * Manages API rate limiting based on model specifications
 */

/**
 * Model Rate Limits (RPM = Requests Per Minute)
 * Updated to use available Gemini 1.5 models
 */
export const MODEL_LIMITS = {
    'gemini-1.5-pro': {
        rpm: 2,
        tpm: 32000,
        rpd: 50,
        contextWindow: 2000000
    },
    'gemini-1.5-flash': {
        rpm: 15,
        tpm: 1000000,
        rpd: 1500,
        contextWindow: 1000000
    },
    'gemini-1.5-flash-8b': {
        rpm: 15,
        tpm: 4000000,
        rpd: 1500,
        contextWindow: 1000000
    },
    'gemini-pro': {
        rpm: 2,
        tpm: 32000,
        rpd: 50,
        contextWindow: 32000
    }
};

/**
 * Rate Limiter Class
 */
export class RateLimiter {
    constructor(model) {
        this.model = model;
        this.limits = MODEL_LIMITS[model] || MODEL_LIMITS['gemini-1.5-flash'];
        this.queue = [];
        this.processing = false;
        this.paused = false;
        this.requestTimestamps = [];
        this.dailyRequestCount = 0;
        this.lastResetDate = new Date().toDateString();

        // Calculate delay between requests
        this.delayMs = (60 * 1000) / this.limits.rpm;

        // Add buffer to be safe (10% slower)
        this.delayMs = this.delayMs * 1.1;
    }

    /**
     * Add request to queue
     */
    async addRequest(requestFunction, metadata = {}) {
        return new Promise((resolve, reject) => {
            this.queue.push({
                fn: requestFunction,
                metadata,
                resolve,
                reject,
                addedAt: Date.now()
            });

            if (!this.processing && !this.paused) {
                this.processQueue();
            }
        });
    }

    /**
     * Process request queue
     */
    async processQueue() {
        if (this.processing || this.paused) {
            return;
        }

        this.processing = true;

        while (this.queue.length > 0 && !this.paused) {
            const request = this.queue.shift();

            try {
                // Check daily limit
                this.checkDailyLimit();

                // Wait for rate limit
                await this.waitForRateLimit();

                // Execute request
                const result = await request.fn();

                // Record successful request
                this.recordRequest();

                // Resolve promise
                request.resolve(result);
            } catch (error) {
                // Handle rate limit errors with retry
                if (this.isRateLimitError(error)) {
                    console.warn('Rate limit hit, adding back to queue');
                    // Put request back in queue
                    this.queue.unshift(request);
                    // Wait longer before retry
                    await this.delay(this.delayMs * 2);
                } else {
                    request.reject(error);
                }
            }
        }

        this.processing = false;
    }

    /**
     * Wait for rate limit compliance
     */
    async waitForRateLimit() {
        const now = Date.now();

        // Clean old timestamps (older than 1 minute)
        this.requestTimestamps = this.requestTimestamps.filter(
            timestamp => now - timestamp < 60000
        );

        // Check if we're at the limit
        if (this.requestTimestamps.length >= this.limits.rpm) {
            const oldestRequest = this.requestTimestamps[0];
            const timeSinceOldest = now - oldestRequest;
            const waitTime = 60000 - timeSinceOldest;

            if (waitTime > 0) {
                await this.delay(waitTime);
            }
        } else {
            // Normal delay between requests
            if (this.requestTimestamps.length > 0) {
                const lastRequest = this.requestTimestamps[this.requestTimestamps.length - 1];
                const timeSinceLast = now - lastRequest;

                if (timeSinceLast < this.delayMs) {
                    await this.delay(this.delayMs - timeSinceLast);
                }
            }
        }
    }

    /**
     * Record a successful request
     */
    recordRequest() {
        this.requestTimestamps.push(Date.now());
        this.dailyRequestCount++;
    }

    /**
     * Check and reset daily limit
     */
    checkDailyLimit() {
        const today = new Date().toDateString();

        if (today !== this.lastResetDate) {
            this.dailyRequestCount = 0;
            this.lastResetDate = today;
        }

        if (this.dailyRequestCount >= this.limits.rpd) {
            throw new Error('Günlük API istek limiti aşıldı');
        }
    }

    /**
     * Check if error is rate limit error
     */
    isRateLimitError(error) {
        const message = error.message || error.toString();
        return message.includes('rate limit') ||
               message.includes('quota') ||
               message.includes('429') ||
               message.includes('RESOURCE_EXHAUSTED');
    }

    /**
     * Pause queue processing
     */
    pause() {
        this.paused = true;
    }

    /**
     * Resume queue processing
     */
    resume() {
        this.paused = false;
        if (this.queue.length > 0) {
            this.processQueue();
        }
    }

    /**
     * Clear queue
     */
    clearQueue() {
        // Reject all pending requests
        this.queue.forEach(request => {
            request.reject(new Error('Queue cleared'));
        });
        this.queue = [];
    }

    /**
     * Get queue status
     */
    getStatus() {
        const now = Date.now();

        // Count requests in last minute
        const recentRequests = this.requestTimestamps.filter(
            timestamp => now - timestamp < 60000
        );

        return {
            queueLength: this.queue.length,
            processing: this.processing,
            paused: this.paused,
            requestsInLastMinute: recentRequests.length,
            remainingRPM: Math.max(0, this.limits.rpm - recentRequests.length),
            dailyRequestCount: this.dailyRequestCount,
            remainingRPD: Math.max(0, this.limits.rpd - this.dailyRequestCount),
            model: this.model,
            delayMs: this.delayMs
        };
    }

    /**
     * Estimate time to complete queue
     */
    estimateCompletionTime() {
        const status = this.getStatus();

        if (status.queueLength === 0) {
            return 0;
        }

        // Calculate based on rate limit
        const requestsPerSecond = this.limits.rpm / 60;
        const estimatedSeconds = status.queueLength / requestsPerSecond;

        return Math.ceil(estimatedSeconds * 1000); // Return in milliseconds
    }

    /**
     * Format estimated time
     */
    formatEstimatedTime() {
        const ms = this.estimateCompletionTime();

        if (ms === 0) {
            return 'Tamamlandı';
        }

        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            const remainingMinutes = minutes % 60;
            return `${hours}s ${remainingMinutes}d`;
        } else if (minutes > 0) {
            const remainingSeconds = seconds % 60;
            return `${minutes}d ${remainingSeconds}s`;
        } else {
            return `${seconds}s`;
        }
    }

    /**
     * Delay helper
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get model info
     */
    getModelInfo() {
        return {
            model: this.model,
            rpm: this.limits.rpm,
            tpm: this.limits.tpm,
            rpd: this.limits.rpd,
            contextWindow: this.limits.contextWindow,
            delayBetweenRequests: Math.round(this.delayMs)
        };
    }

    /**
     * Calculate optimal batch size for model
     */
    getOptimalBatchSize(totalPages) {
        // Pro model (slow) - use larger batches
        if (this.limits.rpm <= 2) {
            return Math.min(10, Math.ceil(totalPages / 5));
        }

        // Flash models (medium) - balanced batches
        if (this.limits.rpm <= 15) {
            return Math.min(5, Math.ceil(totalPages / 10));
        }

        // Fast models - smaller batches for finer control
        return Math.min(3, Math.ceil(totalPages / 15));
    }

    /**
     * Check if batch size is safe for context window
     */
    isBatchSizeSafe(batchSize, avgCharsPerPage = 3000) {
        // Rough estimate: 1 token ≈ 4 characters
        // System prompt ≈ 1000 tokens
        // Response ≈ 2000 tokens per batch
        const systemTokens = 1000;
        const responseTokens = 2000;
        const contentTokens = (batchSize * avgCharsPerPage) / 4;

        const totalTokens = systemTokens + responseTokens + contentTokens;

        return totalTokens < (this.limits.contextWindow * 0.8); // 80% safety margin
    }

    /**
     * Reset (for testing or switching models)
     */
    reset() {
        this.clearQueue();
        this.requestTimestamps = [];
        this.dailyRequestCount = 0;
        this.lastResetDate = new Date().toDateString();
        this.processing = false;
        this.paused = false;
    }
}

/**
 * Create rate limiter for model
 */
export function createRateLimiter(model) {
    return new RateLimiter(model);
}

export default RateLimiter;
