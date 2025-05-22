import { i18n } from "src/utils/i18n"
import { pinia } from "src/utils/pinia"
import { appRouter } from "src/utils/router"
import { createApp } from "vue"
import App from "./app.vue"
import ui from "@nuxt/ui/vue-plugin"
import "./index.css"

appRouter.addRoute({
  path: "/",
  redirect: "/action-popup",
})

// router.beforeEach((to, from, next) => {
//   if (to.path === '/') {
//     return next('/action-popup')
//   }

//   next()
// })

const app = createApp(App).use(i18n).use(ui).use(pinia).use(appRouter)

app.mount("#app")

export default app

// Add error handler through addEventListener instead of using inline assignment
self.addEventListener('error', function(event) {
  console.info("Error: " + event.message)
  console.info("Source: " + event.filename)
  console.info("Line: " + event.lineno)
  console.info("Column: " + event.colno)
  console.info("Error object: " + event.error)
})
