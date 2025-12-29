--
-- PostgreSQL database dump
--

-- Dumped from database version 13.22
-- Dumped by pg_dump version 16.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: topology; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA topology;


--
-- Name: SCHEMA topology; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA topology IS 'PostGIS Topology schema';


--
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial types and functions';


--
-- Name: postgis_topology; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis_topology WITH SCHEMA topology;


--
-- Name: EXTENSION postgis_topology; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION postgis_topology IS 'PostGIS topology spatial types and functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: administradores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.administradores (
    id integer NOT NULL,
    nombre character varying(255),
    responsable character varying(255),
    telefono integer,
    email character varying(255),
    created timestamp with time zone,
    modified timestamp with time zone,
    estado boolean DEFAULT true
);


--
-- Name: administradores_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.administradores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: administradores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.administradores_id_seq OWNED BY public.administradores.id;


--
-- Name: areas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.areas (
    id integer NOT NULL,
    nombre character varying,
    estado boolean,
    created timestamp(6) without time zone,
    modified timestamp(6) without time zone,
    codigo character varying(10)
);


--
-- Name: areas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.areas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: areas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.areas_id_seq OWNED BY public.areas.id;


--
-- Name: audit_deltas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_deltas (
    id character varying(36) NOT NULL,
    audit_id character varying(36) NOT NULL,
    property_name character varying(255) NOT NULL,
    old_value text,
    new_value text
);


--
-- Name: audits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audits (
    id character varying(36) NOT NULL,
    event character varying(255) NOT NULL,
    model character varying(255) NOT NULL,
    entity_id character varying(36) NOT NULL,
    request_id character varying(36) NOT NULL,
    "json_object" text NOT NULL,
    description text,
    source_id character varying(255) DEFAULT NULL::character varying,
    created timestamp(6) without time zone NOT NULL
);


--
-- Name: cruces; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cruces (
    id integer NOT NULL,
    ubigeo_id character varying(9) NOT NULL,
    tipo_gestion integer NOT NULL,
    administradore_id integer,
    proyecto_id integer NOT NULL,
    via1 integer NOT NULL,
    via2 integer NOT NULL,
    tipo_comunicacion integer,
    estado boolean DEFAULT true,
    tipo_cruce integer,
    tipo_estructura integer,
    plano_pdf character varying(255),
    plano_dwg character varying(255),
    tipo_operacion character varying(255),
    ano_implementacion integer,
    observaciones text,
    created timestamp with time zone,
    modified timestamp with time zone,
    nombre character varying(255),
    latitud double precision,
    longitud double precision,
    codigo character varying(7),
    tipo_control integer,
    codigo_anterior character varying(30),
    usuario_registra character varying(255),
    electrico_empresa character varying(255),
    electrico_suministro character varying(255),
    geom public.geometry(Point,4326)
);


--
-- Name: cruces_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cruces_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cruces_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cruces_id_seq OWNED BY public.cruces.id;


--
-- Name: cruces_perifericos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cruces_perifericos (
    id integer NOT NULL,
    cruce_id integer,
    periferico_id integer,
    created timestamp with time zone,
    modified timestamp with time zone
);


--
-- Name: cruces_perifericos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cruces_perifericos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cruces_perifericos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cruces_perifericos_id_seq OWNED BY public.cruces_perifericos.id;


--
-- Name: ejes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ejes (
    id integer NOT NULL,
    nombre_via character varying(255) NOT NULL,
    tipo_via integer,
    nro_carriles smallint,
    ciclovia boolean,
    observaciones text,
    created timestamp with time zone,
    modified timestamp with time zone
);


--
-- Name: ejes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ejes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ejes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ejes_id_seq OWNED BY public.ejes.id;


--
-- Name: equipos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.equipos (
    id integer NOT NULL,
    nombre character varying(25),
    estado boolean,
    created timestamp(6) without time zone,
    modified timestamp(6) without time zone
);


--
-- Name: equipos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.equipos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: equipos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.equipos_id_seq OWNED BY public.equipos.id;


--
-- Name: estado_civils; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.estado_civils (
    id integer NOT NULL,
    nombre character varying(20),
    estado boolean,
    created timestamp(6) without time zone,
    modified timestamp(6) without time zone
);


--
-- Name: estado_civils_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.estado_civils_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: estado_civils_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.estado_civils_id_seq OWNED BY public.estado_civils.id;


--
-- Name: estados; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.estados (
    id integer NOT NULL,
    nombre character varying,
    estado boolean,
    created timestamp(6) without time zone,
    modified timestamp(6) without time zone
);


--
-- Name: estados_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.estados_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: estados_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.estados_id_seq OWNED BY public.estados.id;


--
-- Name: grupos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.grupos (
    id integer NOT NULL,
    nombre character varying(16),
    descripcion character varying(100),
    estado boolean DEFAULT true NOT NULL,
    created timestamp(6) without time zone,
    modified timestamp(6) without time zone,
    edicion boolean
);


--
-- Name: grupos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.grupos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grupos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.grupos_id_seq OWNED BY public.grupos.id;


--
-- Name: grupos_menus; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.grupos_menus (
    id integer NOT NULL,
    menu_id integer NOT NULL,
    grupo_id integer NOT NULL
);


--
-- Name: grupos_menus_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.grupos_menus_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grupos_menus_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.grupos_menus_id_seq OWNED BY public.grupos_menus.id;


--
-- Name: incidencias; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.incidencias (
    id integer NOT NULL,
    parent_id integer,
    tipo character varying,
    estado boolean DEFAULT true NOT NULL,
    prioridade_id integer,
    caracteristica character varying(2)
);


--
-- Name: incidencias_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.incidencias_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: incidencias_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.incidencias_id_seq OWNED BY public.incidencias.id;


--
-- Name: menus; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.menus (
    id integer NOT NULL,
    parent_id integer,
    lft integer,
    rght integer,
    name character varying,
    estado boolean,
    url character varying,
    icono character varying,
    created timestamp(6) without time zone,
    modified timestamp(6) without time zone
);


--
-- Name: menus_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.menus_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: menus_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.menus_id_seq OWNED BY public.menus.id;


--
-- Name: padres; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.padres AS
 SELECT b.id,
    b.parent_id,
    (((a.name)::text || ' - '::text) || (b.name)::text) AS _name
   FROM public.menus a,
    ( SELECT menus.id,
            menus.parent_id,
            menus.name
           FROM public.menus
          WHERE ((menus.estado = true) AND ((menus.url IS NULL) OR ((menus.url)::text = ''::text)))) b
  WHERE (a.id = b.parent_id)
UNION
 SELECT menus.id,
    menus.parent_id,
    menus.name AS _name
   FROM public.menus
  WHERE ((menus.estado = true) AND ((menus.url IS NULL) OR ((menus.url)::text = ''::text)) AND (menus.parent_id IS NULL))
  ORDER BY 3;


--
-- Name: perifericos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.perifericos (
    id integer NOT NULL,
    tipo_periferico integer NOT NULL,
    fabricante character varying(255),
    modelo character varying(255),
    ip cidr,
    numero_serie character varying(255),
    usuario character varying(255),
    password character varying(255),
    en_garantia boolean,
    estado character varying(255),
    observaciones text,
    created timestamp(0) with time zone,
    modified timestamp(0) with time zone,
    usuario_registra character varying(255)
);


--
-- Name: perifericos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.perifericos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: perifericos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.perifericos_id_seq OWNED BY public.perifericos.id;


--
-- Name: personas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.personas (
    id integer NOT NULL,
    tipo_doc_id integer,
    num_doc character varying(10),
    nacionalidad integer,
    ape_pat character varying,
    ape_mat character varying,
    nombres character varying,
    nomcomp character varying,
    direccion integer,
    genero character(1),
    fecnac date,
    movil1 character varying(12),
    movil2 character varying(12),
    email character varying(50),
    estado_civil_id integer,
    estado boolean DEFAULT true NOT NULL,
    created timestamp(6) without time zone,
    modified timestamp(6) without time zone
);


--
-- Name: personas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.personas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: personas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.personas_id_seq OWNED BY public.personas.id;


--
-- Name: prioridades; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.prioridades (
    id integer NOT NULL,
    nombre character varying(20)
);


--
-- Name: prioridades_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.prioridades_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: prioridades_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.prioridades_id_seq OWNED BY public.prioridades.id;


--
-- Name: proyectos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.proyectos (
    id integer NOT NULL,
    siglas character varying(6),
    nombre character varying,
    etapa character varying,
    ejecutado_x_empresa character varying(255),
    estado boolean DEFAULT true NOT NULL,
    ano_proyecto integer,
    created timestamp(6) without time zone,
    usuario_registra character varying(255),
    modified timestamp(6) without time zone,
    usuario_modifica character varying(255),
    red character varying(255)
);


--
-- Name: proyectos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.proyectos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: proyectos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.proyectos_id_seq OWNED BY public.proyectos.id;


--
-- Name: tickets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tickets (
    id integer NOT NULL,
    incidencia_id integer NOT NULL,
    prioridade_id integer,
    cruce_id integer,
    equipo_id integer,
    descripcion text,
    created timestamp(6) without time zone,
    usuario_registra character varying(255),
    modified timestamp(6) without time zone,
    usuario_finaliza character varying(255),
    estado_id integer DEFAULT 1,
    reportadore_id integer,
    reportadore_nombres character varying(255),
    reportadore_dato_contacto character varying(255),
    geom public.geometry(Point,4326)
);


--
-- Name: ubigeos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ubigeos (
    id character varying(9) NOT NULL,
    region character varying(255),
    provincia character varying(255),
    distrito character varying(255)
);


--
-- Name: report1; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.report1 AS
 SELECT tickets.id,
    incidencias.tipo,
    ejes.nombre_via,
    tickets.created,
    ubigeos.distrito,
    estados.nombre,
    tickets.estado_id,
    administradores.nombre AS administrador
   FROM ((((((public.tickets
     JOIN public.incidencias ON ((tickets.incidencia_id = incidencias.id)))
     JOIN public.cruces ON ((tickets.cruce_id = cruces.id)))
     JOIN public.ejes ON ((cruces.via1 = ejes.id)))
     JOIN public.ubigeos ON (((cruces.ubigeo_id)::text = (ubigeos.id)::text)))
     JOIN public.estados ON ((tickets.estado_id = estados.id)))
     JOIN public.administradores ON ((cruces.administradore_id = administradores.id)))
  ORDER BY tickets.created, tickets.incidencia_id;


--
-- Name: reportadores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reportadores (
    id integer NOT NULL,
    nombre character varying NOT NULL,
    estado boolean,
    created timestamp(6) without time zone,
    modified timestamp(6) without time zone
);


--
-- Name: reportadores_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reportadores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reportadores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reportadores_id_seq OWNED BY public.reportadores.id;


--
-- Name: responsables; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.responsables (
    id integer NOT NULL,
    equipo_id integer,
    nombre character varying(30),
    estado boolean DEFAULT true NOT NULL
);


--
-- Name: responsables_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.responsables_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: responsables_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.responsables_id_seq OWNED BY public.responsables.id;


--
-- Name: ticket_seguimientos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ticket_seguimientos (
    id integer NOT NULL,
    ticket_id integer,
    equipo_id integer,
    responsable_id integer,
    reporte text,
    estado_id integer,
    created timestamp(6) without time zone,
    usuario_registra character varying(255),
    modified timestamp(6) without time zone
);


--
-- Name: ticket_seguimientos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ticket_seguimientos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ticket_seguimientos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ticket_seguimientos_id_seq OWNED BY public.ticket_seguimientos.id;


--
-- Name: tickets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tickets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tickets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tickets_id_seq OWNED BY public.tickets.id;


--
-- Name: tipo_doc; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tipo_doc (
    id integer NOT NULL,
    nombre character varying(50),
    estado boolean,
    created timestamp(6) without time zone,
    modified timestamp(6) without time zone
);


--
-- Name: tipo_doc_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tipo_doc_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tipo_doc_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tipo_doc_id_seq OWNED BY public.tipo_doc.id;


--
-- Name: tipos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tipos (
    id integer NOT NULL,
    parent_id integer,
    name character varying(255),
    estado boolean DEFAULT true,
    lft integer,
    rght integer
);


--
-- Name: tipos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tipos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tipos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tipos_id_seq OWNED BY public.tipos.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    persona_id integer,
    usuario character varying(16) NOT NULL,
    grupo_id integer,
    clave character varying,
    area_id integer,
    estado boolean DEFAULT true NOT NULL,
    created timestamp(6) without time zone,
    modified timestamp(6) without time zone,
    online boolean,
    password_hash text
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: administradores id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.administradores ALTER COLUMN id SET DEFAULT nextval('public.administradores_id_seq'::regclass);


--
-- Name: areas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.areas ALTER COLUMN id SET DEFAULT nextval('public.areas_id_seq'::regclass);


--
-- Name: cruces id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cruces ALTER COLUMN id SET DEFAULT nextval('public.cruces_id_seq'::regclass);


--
-- Name: cruces_perifericos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cruces_perifericos ALTER COLUMN id SET DEFAULT nextval('public.cruces_perifericos_id_seq'::regclass);


--
-- Name: ejes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ejes ALTER COLUMN id SET DEFAULT nextval('public.ejes_id_seq'::regclass);


--
-- Name: equipos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipos ALTER COLUMN id SET DEFAULT nextval('public.equipos_id_seq'::regclass);


--
-- Name: estado_civils id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estado_civils ALTER COLUMN id SET DEFAULT nextval('public.estado_civils_id_seq'::regclass);


--
-- Name: estados id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estados ALTER COLUMN id SET DEFAULT nextval('public.estados_id_seq'::regclass);


--
-- Name: grupos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grupos ALTER COLUMN id SET DEFAULT nextval('public.grupos_id_seq'::regclass);


--
-- Name: grupos_menus id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grupos_menus ALTER COLUMN id SET DEFAULT nextval('public.grupos_menus_id_seq'::regclass);


--
-- Name: incidencias id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incidencias ALTER COLUMN id SET DEFAULT nextval('public.incidencias_id_seq'::regclass);


--
-- Name: menus id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.menus ALTER COLUMN id SET DEFAULT nextval('public.menus_id_seq'::regclass);


--
-- Name: perifericos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.perifericos ALTER COLUMN id SET DEFAULT nextval('public.perifericos_id_seq'::regclass);


--
-- Name: personas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personas ALTER COLUMN id SET DEFAULT nextval('public.personas_id_seq'::regclass);


--
-- Name: prioridades id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prioridades ALTER COLUMN id SET DEFAULT nextval('public.prioridades_id_seq'::regclass);


--
-- Name: proyectos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proyectos ALTER COLUMN id SET DEFAULT nextval('public.proyectos_id_seq'::regclass);


--
-- Name: reportadores id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reportadores ALTER COLUMN id SET DEFAULT nextval('public.reportadores_id_seq'::regclass);


--
-- Name: responsables id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.responsables ALTER COLUMN id SET DEFAULT nextval('public.responsables_id_seq'::regclass);


--
-- Name: ticket_seguimientos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_seguimientos ALTER COLUMN id SET DEFAULT nextval('public.ticket_seguimientos_id_seq'::regclass);


--
-- Name: tickets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tickets ALTER COLUMN id SET DEFAULT nextval('public.tickets_id_seq'::regclass);


--
-- Name: tipo_doc id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipo_doc ALTER COLUMN id SET DEFAULT nextval('public.tipo_doc_id_seq'::regclass);


--
-- Name: tipos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipos ALTER COLUMN id SET DEFAULT nextval('public.tipos_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: administradores administradores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.administradores
    ADD CONSTRAINT administradores_pkey PRIMARY KEY (id);


--
-- Name: areas areas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.areas
    ADD CONSTRAINT areas_pkey PRIMARY KEY (id);


--
-- Name: audit_deltas audit_deltas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_deltas
    ADD CONSTRAINT audit_deltas_pkey PRIMARY KEY (id);


--
-- Name: audits audits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audits
    ADD CONSTRAINT audits_pkey PRIMARY KEY (id);


--
-- Name: cruces_perifericos cruces_perifericos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cruces_perifericos
    ADD CONSTRAINT cruces_perifericos_pkey PRIMARY KEY (id);


--
-- Name: cruces cruces_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cruces
    ADD CONSTRAINT cruces_pkey PRIMARY KEY (id);


--
-- Name: ejes ejes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ejes
    ADD CONSTRAINT ejes_pkey PRIMARY KEY (id);


--
-- Name: equipos equipos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipos
    ADD CONSTRAINT equipos_pkey PRIMARY KEY (id);


--
-- Name: estado_civils estado_civils_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estado_civils
    ADD CONSTRAINT estado_civils_pkey PRIMARY KEY (id);


--
-- Name: estados estados_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estados
    ADD CONSTRAINT estados_pkey PRIMARY KEY (id);


--
-- Name: grupos_menus grupos_menus_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grupos_menus
    ADD CONSTRAINT grupos_menus_pkey PRIMARY KEY (id);


--
-- Name: grupos grupos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grupos
    ADD CONSTRAINT grupos_pkey PRIMARY KEY (id);


--
-- Name: incidencias incidencias_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incidencias
    ADD CONSTRAINT incidencias_pkey PRIMARY KEY (id);


--
-- Name: menus menus_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.menus
    ADD CONSTRAINT menus_pkey PRIMARY KEY (id);


--
-- Name: perifericos perifericos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.perifericos
    ADD CONSTRAINT perifericos_pkey PRIMARY KEY (id);


--
-- Name: personas personas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personas
    ADD CONSTRAINT personas_pkey PRIMARY KEY (id);


--
-- Name: prioridades prioridades_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prioridades
    ADD CONSTRAINT prioridades_pkey PRIMARY KEY (id);


--
-- Name: proyectos proyectos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proyectos
    ADD CONSTRAINT proyectos_pkey PRIMARY KEY (id);


--
-- Name: responsables reponsables_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.responsables
    ADD CONSTRAINT reponsables_pkey PRIMARY KEY (id);


--
-- Name: reportadores reportadores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reportadores
    ADD CONSTRAINT reportadores_pkey PRIMARY KEY (id);


--
-- Name: ticket_seguimientos ticket_seguimientos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_seguimientos
    ADD CONSTRAINT ticket_seguimientos_pkey PRIMARY KEY (id);


--
-- Name: tickets tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_pkey PRIMARY KEY (id);


--
-- Name: tipo_doc tipo_doc_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipo_doc
    ADD CONSTRAINT tipo_doc_pkey PRIMARY KEY (id);


--
-- Name: tipos tipos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipos
    ADD CONSTRAINT tipos_pkey PRIMARY KEY (id);


--
-- Name: ubigeos ubigeos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ubigeos
    ADD CONSTRAINT ubigeos_pkey PRIMARY KEY (id);


--
-- Name: users usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- Name: audit_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_id ON public.audit_deltas USING btree (audit_id);


--
-- Name: cruces_geom_gix; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cruces_geom_gix ON public.cruces USING gist (geom);


--
-- Name: tickets_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tickets_created_idx ON public.tickets USING btree (created);


--
-- Name: tickets_estado_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tickets_estado_idx ON public.tickets USING btree (estado_id);


--
-- Name: tickets_geom_gix; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tickets_geom_gix ON public.tickets USING gist (geom);


--
-- Name: grupos_menus Ref_menus_has_grupos_to_grupos; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grupos_menus
    ADD CONSTRAINT "Ref_menus_has_grupos_to_grupos" FOREIGN KEY (grupo_id) REFERENCES public.grupos(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: responsables Reponsables_to_equipos; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.responsables
    ADD CONSTRAINT "Reponsables_to_equipos" FOREIGN KEY (equipo_id) REFERENCES public.equipos(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ticket_seguimientos Ticket_seguimientos_to_reponsables; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_seguimientos
    ADD CONSTRAINT "Ticket_seguimientos_to_reponsables" FOREIGN KEY (responsable_id) REFERENCES public.responsables(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tickets Tickets_to_cruces; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT "Tickets_to_cruces" FOREIGN KEY (cruce_id) REFERENCES public.cruces(id);


--
-- Name: tickets Tickets_to_equipos; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT "Tickets_to_equipos" FOREIGN KEY (equipo_id) REFERENCES public.equipos(id);


--
-- Name: tickets Tickets_to_incidencias; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT "Tickets_to_incidencias" FOREIGN KEY (incidencia_id) REFERENCES public.incidencias(id);


--
-- Name: tickets Tickets_to_reportadores; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT "Tickets_to_reportadores" FOREIGN KEY (reportadore_id) REFERENCES public.reportadores(id);


--
-- Name: cruces fk_cruces_administradores_1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cruces
    ADD CONSTRAINT fk_cruces_administradores_1 FOREIGN KEY (administradore_id) REFERENCES public.administradores(id);


--
-- Name: cruces_perifericos fk_cruces_perifericos_cruces_1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cruces_perifericos
    ADD CONSTRAINT fk_cruces_perifericos_cruces_1 FOREIGN KEY (cruce_id) REFERENCES public.cruces(id);


--
-- Name: cruces_perifericos fk_cruces_perifericos_perifericos_1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cruces_perifericos
    ADD CONSTRAINT fk_cruces_perifericos_perifericos_1 FOREIGN KEY (periferico_id) REFERENCES public.perifericos(id);


--
-- Name: cruces fk_cruces_proyectos_1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cruces
    ADD CONSTRAINT fk_cruces_proyectos_1 FOREIGN KEY (proyecto_id) REFERENCES public.proyectos(id);


--
-- Name: cruces fk_cruces_ubigeos_1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cruces
    ADD CONSTRAINT fk_cruces_ubigeos_1 FOREIGN KEY (ubigeo_id) REFERENCES public.ubigeos(id);


--
-- Name: incidencias incidencias_prioridades; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incidencias
    ADD CONSTRAINT incidencias_prioridades FOREIGN KEY (prioridade_id) REFERENCES public.prioridades(id);


--
-- Name: personas personas_estado_civils; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personas
    ADD CONSTRAINT personas_estado_civils FOREIGN KEY (estado_civil_id) REFERENCES public.estado_civils(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: personas personas_tipoDoc; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personas
    ADD CONSTRAINT "personas_tipoDoc" FOREIGN KEY (tipo_doc_id) REFERENCES public.tipo_doc(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ticket_seguimientos ticket_seguimientos_Tickets; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_seguimientos
    ADD CONSTRAINT "ticket_seguimientos_Tickets" FOREIGN KEY (ticket_id) REFERENCES public.tickets(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ticket_seguimientos ticket_seguimientos_to_equipos; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_seguimientos
    ADD CONSTRAINT ticket_seguimientos_to_equipos FOREIGN KEY (equipo_id) REFERENCES public.equipos(id);


--
-- Name: ticket_seguimientos ticket_seguimientos_to_estados; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_seguimientos
    ADD CONSTRAINT ticket_seguimientos_to_estados FOREIGN KEY (estado_id) REFERENCES public.estados(id);


--
-- Name: users usuarios_areas; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT usuarios_areas FOREIGN KEY (area_id) REFERENCES public.areas(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: users usuarios_grupos; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT usuarios_grupos FOREIGN KEY (grupo_id) REFERENCES public.grupos(id);


--
-- Name: users usuarios_personas; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT usuarios_personas FOREIGN KEY (persona_id) REFERENCES public.personas(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

