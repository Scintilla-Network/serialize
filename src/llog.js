const slog = {
    log: () => {},
    error: () => {},
    warn: () => {},
    info: () => {},
    debug: () => {},
    trace: () => {},
    dir: () => {},
    group: () => {},
    groupEnd: () => {},
    time: () => {},
    timeEnd: () => {},
    timeLog: () => {},
}

const llog = {
    log: (...args) => process.env.VERBOSE_SERIALIZATION === 'true' ? console.log(...args) : undefined,
    error: (...args) => process.env.VERBOSE_SERIALIZATION === 'true' ? console.error(...args) : undefined,
    warn: (...args) => process.env.VERBOSE_SERIALIZATION === 'true' ? console.warn(...args) : undefined,
    info: (...args) => process.env.VERBOSE_SERIALIZATION === 'true' ? console.info(...args) : undefined,
    debug: (...args) => process.env.VERBOSE_SERIALIZATION === 'true' ? console.debug(...args) : undefined,
    trace: (...args) => process.env.VERBOSE_SERIALIZATION === 'true' ? console.trace(...args) : undefined,
    dir: (...args) => process.env.VERBOSE_SERIALIZATION === 'true' ? console.dir(...args) : undefined,
    group: (...args) => process.env.VERBOSE_SERIALIZATION === 'true' ? console.group(...args) : undefined,
    groupEnd: (...args) => process.env.VERBOSE_SERIALIZATION === 'true' ? console.groupEnd(...args) : undefined,
    time: (...args) => process.env.VERBOSE_SERIALIZATION === 'true' ? console.time(...args) : undefined,
    timeEnd: (...args) => process.env.VERBOSE_SERIALIZATION === 'true' ? console.timeEnd(...args) : undefined,
    timeLog: (...args) => process.env.VERBOSE_SERIALIZATION === 'true' ? console.timeLog(...args) : undefined,
}

export { llog };
export default llog;