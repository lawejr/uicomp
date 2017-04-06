module.exports = (function () {
  const findAll = document.querySelectorAll.bind(document)
  const findId = document.getElementById.bind(document)

  const body = document.body
  const overlays = findAll('.uc-modal')
  const openTriggers = findAll('[data-toggle = uc-modal]')
  const closeTriggers = findAll('[data-dismiss = uc-modal]')
  const showEvent = new CustomEvent('ucModal.show')
  const hideEvent = new CustomEvent('ucModal.hide')
  let activeModal = null

  function _open () {
    const targetId = this.dataset.target
    const target = findId(targetId)

    activeModal = target
    target.dispatchEvent(showEvent)
  }

  function _toggleModal () {
    let overflowScroll = document.body.clientWidth < window.innerWidth

    if (overflowScroll) {
      let scrollWidth = _getScrollWidth()

      if (scrollWidth && activeModal) {
        body.style.paddingRight = `${scrollWidth}px`
      }
    } else {
      body.style.paddingRight = '0px'
    }

    body.classList.toggle('uc-no-scroll')
    this.classList.toggle('uc-modal--visible')
  }

  function _close () {
    const target = this.closest('.uc-modal')

    activeModal = null
    target.dispatchEvent(hideEvent)
  }

  function _overlayOnClick (e) {
    const target = e.target
    const isContent = target.closest('.uc-modal__content')

    if (!isContent) {
      e.preventDefault()

      target.dispatchEvent(hideEvent)
    }
  }

  function _onKeyup (e) {
    const isEscape = (e.keyCode === 27 || e.which === 27)

    if (isEscape || activeModal) {
      activeModal.dispatchEvent(hideEvent)
    }
  }

  function _getScrollWidth () {
    let div = document.createElement('div')
    let scrollWidth

    div.style.overflowY = 'scroll'
    div.style.width = '50px'
    div.style.height = '50px'
    div.style.visibility = 'hidden'

    body.appendChild(div)
    scrollWidth = div.offsetWidth - div.clientWidth
    body.removeChild(div)

    return scrollWidth
  }

  function init () {
    for (let i = openTriggers.length; i--;) {
      openTriggers[i].addEventListener('click', _open)
    }

    for (let i = closeTriggers.length; i--;) {
      closeTriggers[i].addEventListener('click', _close)
    }
    for (let i = overlays.length; i--;) {
      overlays[i].addEventListener('ucModal.show', _toggleModal)
      overlays[i].addEventListener('ucModal.hide', _toggleModal)
      overlays[i].addEventListener('click', _overlayOnClick)
    }

    document.addEventListener('keyup', _onKeyup)
  }

  return {
    init: init
  }
})()
