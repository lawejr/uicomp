module.exports = (function () {
// тег <html>
  document.documentElement.classList.remove('uc-no-js')

  const findAll = document.querySelectorAll.bind(document)
  const containers = findAll('.uc-acco')

  function _toggleAcco () {
    let target = this.closest('.uc-acco__item')
    let targetClassList = target.classList
    let action = targetClassList.contains('uc-acco__item--opened') ? 'hide' : 'show'
    let allAccoNodes = target.parentNode.children

    for (let i = allAccoNodes.length; i--;) {
      allAccoNodes[i].classList.remove('uc-acco__item--opened')
    }

    if (action === 'show') {
      targetClassList.add('uc-acco__item--opened')
    }
  }

  function _toggleContent () {
    let target = this.closest('.uc-acco__item')

    target.classList.toggle('uc-acco__item--opened')
  }

  function init () {
    for (let i = containers.length; i--;) {
      const container = containers[i]
      const accoType = container.dataset.type
      const accoItems = container.children
      let actionFunction = _toggleAcco

      switch (accoType) {
        case 'simple':
          actionFunction = _toggleContent
          break
        default:
          break
      }

      for (let i = accoItems.length; i--;) {
        let item = accoItems[i]
        let trigger

        for (let i = item.children.length; i--;) {
          let node = item.children[i]
          if (node.dataset.toggle === 'uc-acco') {
            trigger = node
            break
          }
        }
        trigger.addEventListener('click', actionFunction)
      }
    }
  }

  return {
    init: init
  }
})()
