export default {
    testEnvironment: 'node',
    transform: {
        '^.+\\.js$': 'babel-jest'
    },
    testMatch: [
        '**/tests/**/*.test.js'
    ],
    collectCoverageFrom: [
        'middleware/scheduleValidation.js',
        'routes/admin.js'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    verbose: true
};
