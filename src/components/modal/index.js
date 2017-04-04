(function () {
  var $ = document.querySelectorAll.bind(document)
  var body = document.body
  var overlay = $('.modal')
  var openTriggers = $('[data-toggle = modal]')
  var closeTriggers = $('[data-dismiss = modal]')

  for (var i = 0; i < openTriggers.length; i++) {
    openTriggers[i].addEventListener('click', function (e) {
      e.preventDefault()

      var targetId = this.dataset.target
      var target = $(targetId)

      if (target[0]) {
        body.classList.add('no-scroll')
        target[0].classList.add('modal--visible')
      }
    })
  }

  for (var i = 0; i < closeTriggers.length; i++) {
    closeTriggers[i].addEventListener('click', function (e) {
      e.preventDefault()

      var target = this.closest('.modal')

      if (target) {
        closeModal(target)
      }
    })
  }

  for (var i = 0; i < overlay.length; i++) {
    overlay[i].addEventListener('click', function (e) {
      var target = e.target
      var isContent = target.closest('.modal__content')

      if (!isContent) {
        e.preventDefault()

        closeModal(this)
      }
    })
  }

  function closeModal(target) {
    body.classList.remove('no-scroll')
    target.classList.remove('modal--visible')
  }
})()
