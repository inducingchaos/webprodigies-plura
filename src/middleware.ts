import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextURL } from "next/dist/server/web/next-url"
import { NextResponse } from "next/server"

const isProtectedRoute = createRouteMatcher([])

export default clerkMiddleware((auth, req) => {
    if (isProtectedRoute(req)) auth().protect()

    //  Rewrite for domains.

    const url: NextURL = req.nextUrl
    const searchParams: string = url.searchParams.toString()
    let hostname = req.headers

    const pathWithSearchParams: string = `${url.pathname}${searchParams && `?${searchParams}`}`

    //  If subdomain exists.

    const customSubdomain: string | undefined = hostname
        .get("host")
        ?.split(process.env.NEXT_PUBLIC_DOMAIN ?? "")
        .filter(Boolean)[0]

    if (customSubdomain) {
        return NextResponse.rewrite(new URL(`/${customSubdomain}${pathWithSearchParams}`, req.url))
    }

    if (url.pathname === "/sign-in" || url.pathname === "/sign-up") {
        return NextResponse.redirect(new URL("/agency/sign-in", req.url))
    }

    if (url.pathname === "/" || (url.pathname === "/site" && url.host === process.env.NEXT_PUBLIC_DOMAIN)) {
        return NextResponse.rewrite(new URL("/site", req.url))
    }

    if (url.pathname.startsWith("/agency") || url.pathname.startsWith("/subaccount")) {
        return NextResponse.rewrite(new URL(`${pathWithSearchParams}`, req.url))
    }
})

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
        // Always run for API routes
        "/(api|trpc)(.*)"
    ]
}
