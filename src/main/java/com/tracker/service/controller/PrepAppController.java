package com.tracker.service.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Serves the study app's shell.
 *
 * Spring only resolves a welcome page at the context root, so /prep and /prep/
 * would otherwise 404 while /prep/index.html worked — a confusing difference
 * for anyone who types the obvious URL.
 *
 * There is no SPA catch-all here on purpose: the app routes on the hash, so the
 * server never sees anything below /prep/ except real asset paths.
 */
@Controller
public class PrepAppController {

    @GetMapping({"/prep", "/prep/"})
    public String prepApp() {
        return "forward:/prep/index.html";
    }
}
