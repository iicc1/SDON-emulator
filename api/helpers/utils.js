module.exports = {
  randomBetween: (min, max) => {
    return Math.floor(Math.random() * (max - min + 1) + min)
  },
  sleep: (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
  }
}
