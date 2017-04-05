module.exports = (function () {
  const findAll = document.querySelectorAll.bind(document)
  const findId = document.getElementById.bind(document)

  const body = document.body
  const overlays = findAll('.uc-modal')
  const openTriggers = findAll('[data-toggle = uc-modal]')
  const closeTriggers = findAll('[data-dismiss = uc-modal]')
  let activeModal = null

  function _open (e) {
    e.preventDefault()

    const targetId = this.dataset.target
    const target = findId(targetId)

    body.classList.add('uc-no-scroll')
    target.classList.add('uc-modal--visible')
    activeModal = target
  }

  function _close () {
    body.classList.remove('uc-no-scroll')
    activeModal.classList.remove('uc-modal--visible')
  }

  function _overlayOnClick (e) {
    const target = e.target
    const isContent = target.closest('.uc-modal__content')

    if (!isContent) {
      e.preventDefault()

      _close()
    }
  }

  function init () {
    for (let i = openTriggers.length; i--;) {
      openTriggers[i].addEventListener('click', _open)
    }

    for (let i = closeTriggers.length; i--;) {
      closeTriggers[i].addEventListener('click', _close)
    }

    for (let i = overlays.length; i--;) {
      overlays[i].addEventListener('click', _overlayOnClick)
    }
  }

  return {
    init: init
  }
})()
