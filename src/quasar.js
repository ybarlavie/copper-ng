import Vue from 'vue'

import './styles/quasar.sass'
import '@quasar/extras/material-icons/material-icons.css'
import {
  Quasar, 
  QLayout,
  QHeader,
  QDrawer,
  QPageContainer,
  QPage,
  QToolbar,
  QToolbarTitle,
  QBtn,
  QBtnDropdown,
  QIcon,
  QList,
  QItem,
  QItemSection,
  QItemLabel,
  QInput,
  QField,
  QCarousel,
  QCarouselControl,
  QCarouselSlide,
  QSlider,
  QBadge,
  QTable,
  QTh,
  QTr,
  QTd,
  QToggle,
  QLinearProgress,
  QTooltip,
  QForm,
  Notify,
  ClosePopup,
  QPopupEdit,
} from 'quasar'

Vue.use(Quasar, {
  components: {
    QLayout,
    QHeader,
    QDrawer,
    QPageContainer,
    QPage,
    QToolbar,
    QToolbarTitle,
    QBtn,
    QBtnDropdown,
    QIcon,
    QList,
    QItem,
    QItemSection,
    QItemLabel,
    QInput,
    QField,
    QCarousel,
    QCarouselControl,
    QCarouselSlide,
    QSlider,
    QBadge,
    QTable,
    QTh,
    QTr,
    QTd,
    QToggle,
    QLinearProgress,
    QTooltip,
    QForm,
    QPopupEdit,
  },
  config: {
  },
  directives: {
    ClosePopup,
  },
  plugins: {
    Notify,
  }
 })