<?php
/**
 * Demo-Safe Contact Form Handler
 * --------------------------------
 * PUBLIC DEMO USE ONLY — does NOT send any real email.
 * Validates fields, rejects bots, returns proper JSON.
 * Compatible with existing form.js / mf_form.js frontends.
 */

// -- Only allow POST --
if ( $_SERVER['REQUEST_METHOD'] !== 'POST' ) {
    http_response_code(405);
    exit;
}

header('Content-Type: application/json; charset=utf-8');

// -- Config --
$enable_log   = true;                 // Set false to disable submission logging
$log_file     = __DIR__ . '/logs/contact-demo.log';

$sent_message       = 'Your message has been received. This is a demo — no real email is sent.';
$send_error_message = 'Something went wrong. Please try again.';

// -- Error strings (match originals) --
$name_error      = '*Invalid name (Only letters and white space allowed) <br>';
$email_error     = '*Invalid email format <br>';
$phone_error     = '*Invalid phone number <br>';
$subject_error   = '*Please choose the subject <br>';
$time_error      = '*Please choose the time <br>';
$message_error   = '*Please write your message <br>';

$serverErrors = array();
$post_data    = array();

// -- Honeypot check: bots fill this, humans don't --
if ( !empty( $_POST['website'] ) ) {
    // Silent reject — return success so bots don't retry
    echo json_encode( array( 'status' => 'success', 'message' => $sent_message ), JSON_FORCE_OBJECT );
    exit;
}

// -- Sanitise helper --
function safe_field( $v ) {
    return trim( stripslashes( htmlspecialchars( $v, ENT_QUOTES, 'UTF-8' ) ) );
}

// -- Process known fields only --
$allowed = array( 'name', 'email', 'phone', 'subject', 'Subesubject', 'time', 'message', 'g-recaptcha-response', 'website' );

foreach ( $_POST as $key => $value ) {

    // Skip unknown / extra fields entirely
    if ( ! in_array( $key, $allowed, true ) ) continue;

    $value = safe_field( $value );

    switch ( $key ) {

        case 'name':
            if ( empty( $value ) || ! preg_match( '/^[a-zA-Z\s\'\-\.]+$/u', $value ) ) {
                $serverErrors['errors'] = isset( $serverErrors['errors'] )
                    ? $serverErrors['errors'] . $name_error
                    : $name_error;
            } else {
                $post_data['name'] = $value;
            }
            break;

        case 'email':
            if ( ! filter_var( $value, FILTER_VALIDATE_EMAIL ) ) {
                $serverErrors['errors'] = isset( $serverErrors['errors'] )
                    ? $serverErrors['errors'] . $email_error
                    : $email_error;
            } else {
                $post_data['email'] = $value;
            }
            break;

        case 'phone':
            if ( empty( $value ) ) {
                $serverErrors['errors'] = isset( $serverErrors['errors'] )
                    ? $serverErrors['errors'] . $phone_error
                    : $phone_error;
            } else {
                $post_data['phone'] = $value;
            }
            break;

        case 'subject':
        case 'Subesubject': // legacy field name — map safely to subject
            if ( empty( $value ) ) {
                $serverErrors['errors'] = isset( $serverErrors['errors'] )
                    ? $serverErrors['errors'] . $subject_error
                    : $subject_error;
            } else {
                $post_data['subject'] = $value;
            }
            break;

        case 'time':
            if ( empty( $value ) ) {
                $serverErrors['errors'] = isset( $serverErrors['errors'] )
                    ? $serverErrors['errors'] . $time_error
                    : $time_error;
            } else {
                $post_data['time'] = $value;
            }
            break;

        case 'message':
            if ( empty( $value ) ) {
                $serverErrors['errors'] = isset( $serverErrors['errors'] )
                    ? $serverErrors['errors'] . $message_error
                    : $message_error;
            } else {
                $post_data['message'] = $value;
            }
            break;

        case 'g-recaptcha-response':
        case 'website':
            // Accepted but intentionally ignored — no real reCAPTCHA call, no mail
            break;
    }
}

// -- Return errors if any --
if ( ! empty( $serverErrors ) ) {
    $serverErrors['status'] = 'error';
    echo json_encode( $serverErrors, JSON_FORCE_OBJECT );
    exit;
}

// -- Optional: log submission to file --
if ( $enable_log && ! empty( $post_data ) ) {
    $log_dir = dirname( $log_file );
    if ( ! is_dir( $log_dir ) ) {
        @mkdir( $log_dir, 0755, true );
    }
    $entry  = '[' . date( 'Y-m-d H:i:s' ) . '] ';
    $entry .= 'IP=' . $_SERVER['REMOTE_ADDR'] . ' | ';
    foreach ( $post_data as $k => $v ) {
        $entry .= "$k=" . str_replace( array("\r","\n"), ' ', $v ) . ' | ';
    }
    @file_put_contents( $log_file, $entry . PHP_EOL, FILE_APPEND | LOCK_EX );
}

// -- Return success (no mail sent) --
echo json_encode( array( 'status' => 'success', 'message' => $sent_message ), JSON_FORCE_OBJECT );
exit;
